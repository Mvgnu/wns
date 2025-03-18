export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, format, parseISO } from "date-fns";

// GET handler to fetch events for the calendar view
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Calculate date range based on provided parameters
    let startDate = new Date();
    let endDate: Date;
    
    if (startDateParam && endDateParam) {
      // Use provided date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (daysParam) {
      // Use days parameter
      const days = parseInt(daysParam, 10);
      endDate = addDays(startDate, days);
    } else {
      // Default to 30 days
      endDate = addDays(startDate, 30);
    }
    
    // Get user's groups
    const userGroups = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberGroups: {
          select: { id: true }
        }
      }
    });
    
    const groupIds = userGroups?.memberGroups.map(group => group.id) || [];
    
    // Fetch events:
    // 1. Public events (no group)
    // 2. Events from user's groups
    // 3. Events created by the user
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { 
            groupId: null 
          },
          { 
            groupId: { in: groupIds } 
          },
          { 
            organizerId: userId 
          }
        ],
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        organizer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        attendees: {
          where: { id: userId },
          select: { id: true }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Transform the events to add attendance status
    let transformedEvents = events.map(event => ({
      ...event,
      isAttending: event.attendees.length > 0
    }));
    
    // Handle recurring events - generate instances for the date range
    const recurringEvents = events.filter(event => event.isRecurring);
    if (recurringEvents.length > 0) {
      const recurringInstances = [];
      
      for (const event of recurringEvents) {
        // Get all instances for this event in the given date range
        try {
          const instancesResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/events/recurring/instances?eventId=${event.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
          
          if (instancesResponse.ok) {
            const instancesData = await instancesResponse.json();
            
            // Add each instance to our events array with the appropriate metadata
            if (Array.isArray(instancesData.instances)) {
              for (const instance of instancesData.instances) {
                // Check if this user is attending this specific instance
                let userInstanceResponse = null;
                try {
                  const attendanceResponse = await prisma.eventInstanceResponse.findFirst({
                    where: {
                      eventId: event.id,
                      userId,
                      date: {
                        gte: new Date(new Date(instance.date).setHours(0, 0, 0, 0)),
                        lt: new Date(new Date(instance.date).setHours(23, 59, 59, 999)),
                      }
                    }
                  });
                  
                  userInstanceResponse = attendanceResponse;
                } catch (error) {
                  console.error("Error fetching instance attendance:", error);
                }
                
                recurringInstances.push({
                  ...event,
                  id: `${event.id}_${instance.date}`, // Create a unique ID for the instance
                  startTime: instance.date,
                  endTime: instance.endTime,
                  isRecurringInstance: true,
                  parentEventId: event.id,
                  instanceDate: instance.date,
                  instanceAttendance: userInstanceResponse?.response || null,
                  isAttending: userInstanceResponse?.response === "yes"
                });
              }
            }
          }
        } catch (error) {
          console.error("Error generating instances for event:", event.id, error);
        }
      }
      
      // Add all recurring instances to the events array
      transformedEvents = [...transformedEvents, ...recurringInstances];
    }
    
    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
} 