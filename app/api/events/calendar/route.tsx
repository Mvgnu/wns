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
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    
    // Calculate date range
    const now = new Date();
    const endDate = addDays(now, days);
    
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
          gte: now,
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
    const transformedEvents = events.map(event => ({
      ...event,
      isAttending: event.attendees.length > 0
    }));
    
    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
} 