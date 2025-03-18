import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, isBefore, parseISO } from "date-fns";
import { z } from "zod";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Validation schema for creating standard (non-recurring) events
const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format").optional().nullable(),
  locationId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  
  // Allow either isRecurring: false or eventType: "once"
  isRecurring: z.boolean().default(false),
  eventType: z.enum(["once", "recurring"]).optional(),
  
  // These fields should not be needed but might be sent by the client
  recurringPattern: z.string().optional(),
  recurringDays: z.array(z.number()).optional().default([]),
  recurringEndDate: z.string().optional().default(""),
  
  // Optional advanced settings
  image: z.string().optional().nullable(),
});

/**
 * POST handler for creating standard (non-recurring) events
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const requestData = await request.json();
    
    // Check if this is a recurring event request that should be redirected
    if ((requestData.isRecurring === true || requestData.eventType === "recurring") && 
        requestData.recurringPattern && requestData.recurringEndDate) {
      // This should be handled by the dedicated recurring endpoint
      return NextResponse.json(
        { error: "Recurring events should be created using the /api/events/recurring/create endpoint" },
        { status: 400 }
      );
    }

    // Validate request body as a standard non-recurring event
    const validationResult = createEventSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validate that start time is in the future
    const startTime = new Date(validatedData.startTime);
    const currentTime = new Date();
    if (isBefore(startTime, currentTime)) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
    }

    // Validate that end time is after start time (if provided)
    if (validatedData.endTime) {
      const endTime = new Date(validatedData.endTime);
      if (isBefore(endTime, startTime)) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    // If this is a group event, check if the user is a member of the group
    if (validatedData.groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: validatedData.groupId,
          OR: [
            { ownerId: user.id },
            { members: { some: { id: user.id } } },
            { admins: { some: { userId: user.id } } }
          ],
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "You are not a member of this group" },
          { status: 403 }
        );
      }
    }

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        location: validatedData.locationId
          ? { connect: { id: validatedData.locationId } }
          : undefined,
        group: validatedData.groupId
          ? { connect: { id: validatedData.groupId } }
          : undefined,
        organizer: { connect: { id: user.id } },
        
        // Non-recurring fields - always false for this endpoint
        isRecurring: false,
        
        // Handle optional image
        image: validatedData.image,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        group: true,
        location: true,
        attendees: true,
      },
    });

    return NextResponse.json(
      { message: "Event created successfully", event: newEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for main events listing
 * Excludes recurring event instances (subevents) to prevent spam
 * Only shows parent events
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
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    let limit = parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString());
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    
    const skip = (page - 1) * limit;
    
    // Filtering
    const groupId = searchParams.get("groupId");
    const userId = searchParams.get("userId"); // Organizer filter
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    // Date filtering with sensible defaults
    let startDate = startDateStr ? parseISO(startDateStr) : new Date();
    let endDate = endDateStr ? parseISO(endDateStr) : addDays(new Date(), 90); // Default 90 days ahead
    
    // Filter conditions
    const where: any = {
      // IMPORTANT: Filter out sub-instances by ensuring parentEventId is null
      // This is crucial to prevent spam in the main events listing
      parentEventId: null,
      
      // Apply other filters
      ...(groupId && { groupId }),
      ...(userId && { organizerId: userId }),
    };
    
    // Date conditions - include recurring events even if their start date is in the past
    // since they generate future instances
    where.OR = [
      // Regular events in the future
      {
        isRecurring: false,
        startTime: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      },
      // Recurring events that haven't ended yet
      {
        isRecurring: true,
        OR: [
          // Recurring events without end date
          { recurringEndDate: null },
          // Recurring events with end date in the future
          { recurringEndDate: { gte: startDate } },
        ],
      },
    ];
    
    // First, get private groups the user has access to
    const userGroups = await prisma.group.findMany({
      where: {
        isPrivate: true,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
      select: { id: true },
    });
    
    const userGroupIds = userGroups.map(g => g.id);
    
    // Add group visibility filter
    where.OR.push(
      // Public groups
      { group: { isPrivate: false } },
      // Private groups the user is part of
      { groupId: { in: userGroupIds } },
      // Events with no group
      { groupId: null }
    );
    
    // Execute count and query
    const totalEvents = await prisma.event.count({ where });
    
    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          }
        },
        attendees: {
          select: {
            id: true,
          },
          take: 5, // Limit to avoid huge responses
        },
      },
      orderBy: {
        startTime: "asc", // Default sorting
      },
      skip,
      take: limit,
    });
    
    // Add user-specific attendance status
    const eventsWithAttendance = events.map(event => {
      const isAttending = event.attendees.some(a => a.id === session.user.id);
      const attendeeCount = event.attendees.length;
      
      // For recurring events, we also check if the user has individual instance responses
      let futureAttendance = null;
      if (event.isRecurring) {
        // Note: This will be populated in a separate API call to avoid complexity here
        // /api/events/recurring/instances will provide instance-specific attendance
        futureAttendance = {
          instanceCount: null, // Populated on demand
          upcomingResponses: [] // Populated on demand
        };
      }
      
      // Remove the full attendees list to reduce payload size
      const { attendees, ...eventWithoutAttendees } = event;
      
      return {
        ...eventWithoutAttendees,
        isAttending,
        attendeeCount,
        ...(futureAttendance && { futureAttendance }),
      };
    });
    
    // Pagination metadata
    const totalPages = Math.ceil(totalEvents / limit);
    
    return NextResponse.json({
      events: eventsWithAttendance,
      pagination: {
        page,
        limit,
        totalEvents,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
    
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
} 