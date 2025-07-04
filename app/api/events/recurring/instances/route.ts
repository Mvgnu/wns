import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays, eachDayOfInterval, format, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";

// Default and maximum limits for instance generation
const DEFAULT_DAYS_AHEAD = 60; // Show instances for next 60 days by default
const MAX_DAYS_AHEAD = 365; // Hard limit: never generate more than a year of instances
const MAX_INSTANCES_PER_REQUEST = 100; // Pagination limit

/**
 * GET handler for retrieving instances of a recurring event
 * with proper pagination and sensible limits
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Get and validate parameters
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Parse date range parameters with sensible defaults and limits
    const startDateStr = searchParams.get("startDate") || new Date().toISOString();
    const startDate = parseISO(startDateStr);
    
    // Parse days ahead parameter with limits
    let daysAhead = parseInt(searchParams.get("daysAhead") || DEFAULT_DAYS_AHEAD.toString());
    if (isNaN(daysAhead) || daysAhead < 1) {
      daysAhead = DEFAULT_DAYS_AHEAD;
    }
    if (daysAhead > MAX_DAYS_AHEAD) {
      daysAhead = MAX_DAYS_AHEAD;
    }
    
    // Calculate end date
    const endDate = addDays(startDate, daysAhead);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    if (limit > MAX_INSTANCES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Limit cannot exceed ${MAX_INSTANCES_PER_REQUEST}` },
        { status: 400 }
      );
    }
    
    // Get the recurring event
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        isRecurring: true, // Must be a recurring event
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        location: true,
        group: true,
      },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: "Recurring event not found" },
        { status: 404 }
      );
    }
    
    // Access control: Check if private group and user is member
    if (event.group?.isPrivate) {
      const isMember = await prisma.group.findFirst({
        where: {
          id: event.groupId as string,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } },
          ],
        },
      });
      
      if (!isMember) {
        return NextResponse.json(
          { error: "You don't have access to this event's instances" },
          { status: 403 }
        );
      }
    }
    
    // Generate instances based on the recurring pattern
    const instances = generateEventInstances(event, startDate, endDate);
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedInstances = instances.slice(offset, offset + limit);
    
    // Get the user's attendance responses for these instances
    const dateRange = paginatedInstances.map(instance => new Date(instance.date));
    const responses = await prisma.participationResponse.findMany({
      where: {
        eventId,
        userId: session.user.id,
        instanceDate: {
          in: dateRange,
        },
      },
    });
    
    // Merge attendance data with instance data
    const instancesWithAttendance = paginatedInstances.map(instance => {
      const response = responses.find(r => 
        isSameDay(new Date(r.instanceDate!), new Date(instance.date))
      );
      
      return {
        ...instance,
        userResponse: response?.response || null,
      };
    });
    
    // Count total instances for pagination info
    const totalInstances = instances.length;
    const totalPages = Math.ceil(totalInstances / limit);
    
    return NextResponse.json({
      instances: instancesWithAttendance,
      pagination: {
        page,
        limit,
        totalInstances,
        totalPages,
        hasMore: page < totalPages,
      },
    });
    
  } catch (error) {
    console.error("Error retrieving recurring event instances:", error);
    return NextResponse.json(
      { error: "Failed to retrieve event instances" },
      { status: 500 }
    );
  }
}

/**
 * Generate recurring event instances based on pattern
 */
function generateEventInstances(event: any, startDate: Date, endDate: Date) {
  // Start with event's original start date/time
  const eventStartTime = new Date(event.startTime);
  const eventEndTime = event.endTime ? new Date(event.endTime) : null;
  
  const instances = [];
  
  // Don't generate instances beyond the endDate or the event's recurringEndDate if set
  const effectiveEndDate = event.recurringEndDate && isBefore(new Date(event.recurringEndDate), endDate) 
    ? new Date(event.recurringEndDate) 
    : endDate;
  
  // Get all days in the date range
  const allDaysInRange = eachDayOfInterval({
    start: startDate,
    end: effectiveEndDate,
  });
  
  // Filter days based on the recurring pattern
  if (event.recurringPattern === "weekly") {
    // For weekly pattern, filter days that match the recurring days of week
    for (const day of allDaysInRange) {
      const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (event.recurringDays.includes(dayOfWeek)) {
        // This day matches the recurring pattern
        const instanceDate = new Date(day);
        // Set the same time as the original event
        instanceDate.setHours(
          eventStartTime.getHours(),
          eventStartTime.getMinutes(),
          eventStartTime.getSeconds()
        );
        
        let instanceEndTime = null;
        if (eventEndTime) {
          instanceEndTime = new Date(day);
          instanceEndTime.setHours(
            eventEndTime.getHours(),
            eventEndTime.getMinutes(),
            eventEndTime.getSeconds()
          );
        }
        
        instances.push({
          id: `${event.id}_${format(instanceDate, 'yyyy-MM-dd')}`,
          parentEventId: event.id,
          title: event.title,
          description: event.description,
          date: instanceDate.toISOString(),
          startTime: instanceDate.toISOString(),
          endTime: instanceEndTime ? instanceEndTime.toISOString() : null,
          location: event.location,
          group: event.group,
          organizer: event.organizer,
        });
      }
    }
  } else if (event.recurringPattern === "monthly") {
    // For monthly pattern, filter by days of month (1-31)
    for (const day of allDaysInRange) {
      const dayOfMonth = day.getDate(); // 1-31
      
      if (event.recurringDays.includes(dayOfMonth)) {
        // This day matches the recurring pattern
        const instanceDate = new Date(day);
        // Set the same time as the original event
        instanceDate.setHours(
          eventStartTime.getHours(),
          eventStartTime.getMinutes(),
          eventStartTime.getSeconds()
        );
        
        let instanceEndTime = null;
        if (eventEndTime) {
          instanceEndTime = new Date(day);
          instanceEndTime.setHours(
            eventEndTime.getHours(),
            eventEndTime.getMinutes(),
            eventEndTime.getSeconds()
          );
        }
        
        instances.push({
          id: `${event.id}_${format(instanceDate, 'yyyy-MM-dd')}`,
          parentEventId: event.id,
          title: event.title,
          description: event.description,
          date: instanceDate.toISOString(),
          startTime: instanceDate.toISOString(),
          endTime: instanceEndTime ? instanceEndTime.toISOString() : null,
          location: event.location,
          group: event.group,
          organizer: event.organizer,
        });
      }
    }
  }
  
  return instances;
} 