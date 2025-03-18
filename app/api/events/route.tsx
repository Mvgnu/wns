import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeServerSession } from "@/lib/sessionHelper";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";
import { addDays, addWeeks, addMonths, isBefore, getDay, getDate } from "date-fns";

// Schema for event creation
const eventCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startTime: z.string().refine((value) => !isNaN(Date.parse(value)), {
    message: "Start time must be a valid date string",
  }),
  endTime: z.string().refine((value) => !isNaN(Date.parse(value)), {
    message: "End time must be a valid date string",
  }).optional().or(z.literal('')).nullable(),
  image: z.union([
    z.string().url({ message: "Image must be a valid URL" }),
    z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null().transform(() => undefined)
  ]).optional(),
  groupId: z.string().optional().transform(val => val === "" ? undefined : val),
  locationId: z.string().optional().transform(val => val === "" ? undefined : val),
  // Event type
  eventType: z.enum(["once", "recurring"]).optional(),
  // Recurring event fields
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurringDays: z.array(z.number()).optional(),
  recurringEndDate: z.string().refine((value) => !value || !isNaN(Date.parse(value)), {
    message: "Recurring end date must be a valid date string",
  }).optional().nullable().transform(val => val === "" ? null : val),
  // Who can join the event
  joinRestriction: z.enum(["everyone", "groupOnly"]).default("everyone"),
});

// Schema for event update
const eventUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  startTime: z.string().refine((value) => !isNaN(Date.parse(value)), {
    message: "Start time must be a valid date string",
  }).optional(),
  endTime: z.string().refine((value) => !isNaN(Date.parse(value)), {
    message: "End time must be a valid date string",
  }).optional().or(z.literal('')).nullable(),
  image: z.union([
    z.string().url({ message: "Image must be a valid URL" }),
    z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null().transform(() => undefined)
  ]).optional(),
  locationId: z.string().optional(),
  // Recurring event fields
  isRecurring: z.boolean().optional(),
  recurringPattern: z.enum(["weekly", "monthly"]).optional(),
  recurringDays: z.array(z.number()).optional(),
  recurringEndDate: z.string().refine((value) => !value || !isNaN(Date.parse(value)), {
    message: "Recurring end date must be a valid date string",
  }).optional().nullable().transform(val => val === "" ? null : val),
});

// Schema for attendance operations
const attendanceOperationSchema = z.object({
  operation: z.enum(["join", "leave"]),
});

// Helper function to check if the user has access to a group
async function hasGroupAccess(groupId: string, userId: string): Promise<boolean> {
  if (!groupId) return true;
  
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      ownerId: true,
      isPrivate: true,
      members: {
        where: { id: userId },
        select: { id: true },
      },
    },
  });
  
  if (!group) return false;
  
  // If the group is private, check membership
  if (group.isPrivate) {
    // User is owner or member
    return group.ownerId === userId || group.members.length > 0;
  }
  
  // Public group - anyone can access
  return true;
}

// Helper function to create recurring event instances
async function createRecurringEventInstances(
  templateEvent: any,
  recurringPattern: string,
  recurringDays: number[],
  recurringEndDate: Date | null,
  userId: string
) {
  // Start from the template event date
  let currentDate = new Date(templateEvent.startTime);
  const instances = [];
  
  // Calculate time difference between start and end time
  const duration = templateEvent.endTime 
    ? new Date(templateEvent.endTime).getTime() - new Date(templateEvent.startTime).getTime()
    : 0;
  
  // Create instances up to 3 months in advance or until the end date, whichever comes first
  const maxDate = recurringEndDate || addMonths(currentDate, 3);
  
  // Weekly pattern
  if (recurringPattern === "weekly") {
    // Get first instance date
    let nextInstanceDate = findNextWeeklyDate(currentDate, recurringDays);
    
    while (isBefore(nextInstanceDate, maxDate)) {
      // Create the event instance
      const instance = await createEventInstance(
        templateEvent,
        nextInstanceDate,
        duration,
        userId
      );
      
      instances.push(instance);
      
      // Move to next week and find next date
      nextInstanceDate = findNextWeeklyDate(addDays(nextInstanceDate, 1), recurringDays);
    }
  }
  // Monthly pattern
  else if (recurringPattern === "monthly") {
    // Get first instance date
    let nextInstanceDate = findNextMonthlyDate(currentDate, recurringDays);
    
    while (isBefore(nextInstanceDate, maxDate)) {
      // Create the event instance
      const instance = await createEventInstance(
        templateEvent,
        nextInstanceDate,
        duration,
        userId
      );
      
      instances.push(instance);
      
      // Move to next month and find next date
      nextInstanceDate = findNextMonthlyDate(addDays(nextInstanceDate, 1), recurringDays);
    }
  }
  
  return instances;
}

// Helper function to find the next weekly date based on recurringDays
function findNextWeeklyDate(date: Date, recurringDays: number[]): Date {
  if (!recurringDays.length) return date;
  
  let currentDate = new Date(date);
  const currentDay = getDay(currentDate);
  
  // Find the next day in the recurring days pattern
  for (let i = 0; i < 7; i++) {
    const checkDate = addDays(currentDate, i);
    const checkDay = getDay(checkDate);
    
    if (recurringDays.includes(checkDay) && (i > 0 || checkDay === currentDay)) {
      return checkDate;
    }
  }
  
  // If no day found in the next week, go to the first day in the pattern
  return addDays(currentDate, (7 - currentDay + recurringDays[0]) % 7);
}

// Helper function to find the next monthly date based on recurringDays
function findNextMonthlyDate(date: Date, recurringDays: number[]): Date {
  if (!recurringDays.length) return date;
  
  let currentDate = new Date(date);
  const currentMonth = currentDate.getMonth();
  
  // Try to find a date in the current month
  for (let day of recurringDays.sort((a, b) => a - b)) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(day);
    
    if (checkDate.getMonth() === currentMonth && isBefore(date, checkDate)) {
      return checkDate;
    }
  }
  
  // If no suitable date in the current month, get the first date in the next month
  const nextMonth = addMonths(currentDate, 1);
  const nextMonthDate = new Date(nextMonth);
  nextMonthDate.setDate(recurringDays[0] > 28 ? 1 : recurringDays[0]);
  
  return nextMonthDate;
}

// Helper function to create a single event instance
async function createEventInstance(templateEvent: any, instanceDate: Date, duration: number, userId: string) {
  const startTime = new Date(instanceDate);
  
  // Calculate end time if original event had an end time
  let endTime = null;
  if (duration > 0) {
    endTime = new Date(startTime.getTime() + duration);
  }
  
  // Create the event instance
  const instance = await prisma.event.create({
    data: {
      title: templateEvent.title,
      description: templateEvent.description,
      startTime,
      endTime,
      image: templateEvent.image,
      organizerId: userId,
      groupId: templateEvent.groupId,
      locationId: templateEvent.locationId,
      parentEventId: templateEvent.id, // Link to the template event
      attendees: {
        connect: { id: userId },
      },
    },
  });
  
  return instance;
}

// GET handler for retrieving events with filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get("organizerId");
    const groupId = searchParams.get("groupId");
    const locationId = searchParams.get("locationId");
    const attendeeId = searchParams.get("attendeeId");
    const fromDate = searchParams.get("fromDate") ? new Date(searchParams.get("fromDate") as string) : null;
    const toDate = searchParams.get("toDate") ? new Date(searchParams.get("toDate") as string) : null;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const includeRecurring = searchParams.get("includeRecurring") === "true";

    // Get the current user for group access checks - use safe session helper
    const session = await getSafeServerSession();
    const userId = session?.user?.id;

    // Build query based on filters
    const whereClause: any = {};
    if (organizerId) whereClause.organizerId = organizerId;
    if (locationId) whereClause.locationId = locationId;
    
    // Date filtering
    if (fromDate || toDate) {
      whereClause.startTime = {};
      if (fromDate) whereClause.startTime.gte = fromDate;
      if (toDate) whereClause.startTime.lte = toDate;
    }

    // Handle group access checks
    if (groupId) {
      // Check if user has access to this group
      if (userId) {
        const hasAccess = await hasGroupAccess(groupId, userId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: "You don't have access to this group's events" },
            { status: 403 }
          );
        }
      }
      
      whereClause.groupId = groupId;
    } else {
      // For general event listing (not filtered by group), exclude events from private groups
      // unless the user is a member
      if (userId) {
        whereClause.OR = [
          { group: { isPrivate: false } },
          { group: { isPrivate: true, members: { some: { id: userId } } } },
          { group: { isPrivate: true, ownerId: userId } },
          { group: null },
        ];
      } else {
        whereClause.OR = [
          { group: { isPrivate: false } },
          { group: null },
        ];
      }
    }

    // Handle recurring event inclusion
    if (!includeRecurring) {
      whereClause.parentEventId = null;
    }

    // Handle attendeeId filter separately since it requires a relation query
    let events = [];
    let totalEvents = 0;

    if (attendeeId) {
      // Find events where the user is an attendee
      events = await prisma.event.findMany({
        where: {
          attendees: {
            some: {
              id: attendeeId,
            },
          },
          ...whereClause,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: limit,
        skip,
      });
      
      totalEvents = await prisma.event.count({
        where: {
          attendees: {
            some: {
              id: attendeeId,
            },
          },
          ...whereClause,
        },
      });
    } else {
      // Regular event query
      events = await prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: limit,
        skip,
      });
      
      totalEvents = await prisma.event.count({ where: whereClause });
    }

    // If user is logged in, add attendance status to each event
    if (session?.user) {
      const userId = session.user.id;
      
      // Get all event IDs where the user is an attendee
      const userAttendances = await prisma.event.findMany({
        where: {
          OR: [
            { organizerId: userId },
            { attendees: { some: { id: userId } } },
          ],
          id: { in: events.map(event => event.id) },
        },
        select: { id: true, organizerId: true },
      });
      
      // Create a lookup map for quick attendance checking
      const attendanceMap = new Map();
      userAttendances.forEach(event => {
        attendanceMap.set(event.id, {
          isAttending: true,
          isOrganizer: event.organizerId === userId,
        });
      });
      
      // Add attendance status to each event
      events = events.map(event => ({
        ...event,
        attendance: attendanceMap.get(event.id) || { isAttending: false, isOrganizer: false },
      }));
    }

    // Check for upcoming recurring events that need to be generated
    if (userId && includeRecurring) {
      const thirtyDaysFromNow = addDays(new Date(), 30);
      const recurringTemplates = await prisma.event.findMany({
        where: {
          isRecurring: true,
          recurringPattern: { not: null },
          recurringDays: { isEmpty: false },
          OR: [
            { recurringEndDate: { gt: new Date() } },
            { recurringEndDate: null },
          ],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          recurringPattern: true,
          recurringDays: true,
          recurringEndDate: true,
        },
      });

      // For each template, check if we need to generate more instances
      for (const template of recurringTemplates) {
        // Find the latest instance of this template
        const latestInstance = await prisma.event.findFirst({
          where: {
            parentEventId: template.id,
          },
          orderBy: {
            startTime: 'desc',
          },
        });

        // If no instances yet or the latest instance is too close to our buffer period,
        // generate more instances
        if (!latestInstance || latestInstance.startTime < thirtyDaysFromNow) {
          // Generate more instances
          try {
            await createRecurringEventInstances(
              template,
              template.recurringPattern as string,
              template.recurringDays as number[],
              template.recurringEndDate as Date | null,
              userId
            );
          } catch (error) {
            console.error("Error generating recurring events:", error);
          }
        }
      }
    }

    return NextResponse.json({
      events,
      pagination: {
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
        page,
        limit,
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

// POST handler for creating new events
export async function POST(req: NextRequest) {
  try {
    const session = await getSafeServerSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized - Please log in to create events", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.json();
    const validatedData = eventCreateSchema.parse(body);

    // Check if this is a recurring event
    if (validatedData.eventType === "recurring") {
      // Redirect to the recurring event creation endpoint
      return NextResponse.json({
        redirect: "/api/events/recurring/create",
        data: validatedData,
      });
    }

    // Validate start time is in the future
    const startTime = new Date(validatedData.startTime);
    if (isBefore(startTime, new Date())) {
      return new NextResponse("Start time must be in the future", { status: 400 });
    }

    // Validate end time is after start time if provided
    if (validatedData.endTime) {
      const endTime = new Date(validatedData.endTime);
      if (isBefore(endTime, startTime)) {
        return new NextResponse("End time must be after start time", { status: 400 });
      }
    }

    // Check group membership if a group is specified
    if (validatedData.groupId) {
      const hasAccess = await hasGroupAccess(validatedData.groupId, user.id);
      if (!hasAccess) {
        return new NextResponse("You don't have access to this group", { status: 403 });
      }
    }

    // Extract eventType and prepare data for Prisma
    const { eventType, ...eventData } = validatedData;
    
    const event = await prisma.event.create({
      data: {
        ...eventData,
        organizerId: user.id,
        // Set joinRestriction if not specified
        joinRestriction: validatedData.joinRestriction || "everyone",
        // Add the creator as an attendee automatically
        attendees: {
          connect: [{ id: user.id }]
        },
        // Add participation response for the creator
        participationResponses: {
          create: {
            userId: user.id,
            response: "attending"
          }
        }
      },
      include: {
        organizer: true,
        group: true,
        location: true,
        attendees: true,
      },
    });

    // Send notification to group members if this is a group event
    if (event.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: event.groupId },
        include: {
          members: true,
        },
      });

      if (group) {
        for (const member of group.members) {
          // Don't send notification to the event creator
          if (member.id !== user.id) {
            const notification = await prisma.notification.create({
              data: {
                userId: member.id,
                type: "NEW_GROUP_EVENT",
                message: `New event "${event.title}" in ${group.name}`,
                read: false,
                relatedId: event.id,
                linkUrl: `/events/${event.id}`,
                actorId: user.id,
              },
            });

            sendNotificationToUser(member.id, notification);
          }
        }
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors }), { status: 400 });
    }
    return new NextResponse(
      JSON.stringify({ error: "Failed to create event" }),
      { status: 500 }
    );
  }
}

// PUT handler for updating events
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const validatedData = eventUpdateSchema.parse(updateData);

    // Check if the event exists and belongs to the user
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            ownerId: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Allow event organizer or group owner to update the event
    const isOrganizer = existingEvent.organizerId === session.user.id;
    const isGroupOwner = existingEvent.group && existingEvent.group.ownerId === session.user.id;

    if (!isOrganizer && !isGroupOwner) {
      return NextResponse.json(
        { error: "You can only update events you organize or group events as the group owner" },
        { status: 403 }
      );
    }

    // If locationId is provided, verify it exists
    if (validatedData.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: validatedData.locationId },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }
    }

    // Parse date strings to Date objects if provided
    const eventData: any = { ...validatedData };
    if (validatedData.startTime) {
      eventData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime !== undefined) {
      eventData.endTime = validatedData.endTime && validatedData.endTime !== '' ? new Date(validatedData.endTime) : null;
    }
    if (validatedData.recurringEndDate !== undefined) {
      eventData.recurringEndDate = validatedData.recurringEndDate ? new Date(validatedData.recurringEndDate) : null;
    }

    // If this is a recurring event template, ask if we should update all instances
    const updateAll = req.headers.get('X-Update-All-Instances') === 'true';

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    // If requested and this is a recurring event, update all future instances
    if (updateAll && existingEvent.isRecurring) {
      // Get all future instances of this event
      const now = new Date();
      const futureInstances = await prisma.event.findMany({
        where: {
          parentEventId: id,
          startTime: { gte: now },
        },
      });

      // Update each instance with the new data
      // (excluding certain fields that should be instance-specific)
      const instanceUpdateData = { ...eventData };
      delete instanceUpdateData.startTime; // Don't change the scheduled time
      delete instanceUpdateData.recurringPattern; // These apply only to the template
      delete instanceUpdateData.recurringDays;
      delete instanceUpdateData.recurringEndDate;
      delete instanceUpdateData.isRecurring;

      // Update all instances in parallel
      if (Object.keys(instanceUpdateData).length > 0) {
        await Promise.all(
          futureInstances.map(instance =>
            prisma.event.update({
              where: { id: instance.id },
              data: instanceUpdateData,
            })
          )
        );
      }

      // If the recurring pattern changed, delete future instances and create new ones
      if (
        (eventData.recurringPattern && eventData.recurringPattern !== existingEvent.recurringPattern) ||
        (eventData.recurringDays && JSON.stringify(eventData.recurringDays) !== JSON.stringify(existingEvent.recurringDays)) ||
        (eventData.recurringEndDate !== undefined && eventData.recurringEndDate !== existingEvent.recurringEndDate)
      ) {
        // Delete future instances
        await prisma.event.deleteMany({
          where: {
            parentEventId: id,
            startTime: { gte: now },
          },
        });

        // Create new instances based on the updated recurring pattern
        if (updatedEvent.isRecurring && updatedEvent.recurringPattern && updatedEvent.recurringDays?.length) {
          await createRecurringEventInstances(
            updatedEvent,
            updatedEvent.recurringPattern,
            updatedEvent.recurringDays,
            updatedEvent.recurringEndDate,
            session.user.id
          );
        }
      }
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing events
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAllInstances = searchParams.get("deleteAllInstances") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Allow event organizer or group owner to delete the event
    const isOrganizer = existingEvent.organizerId === session.user.id;
    const isGroupOwner = existingEvent.group && existingEvent.group.ownerId === session.user.id;

    if (!isOrganizer && !isGroupOwner) {
      return NextResponse.json(
        { error: "You can only delete events you organize or group events as the group owner" },
        { status: 403 }
      );
    }

    // Delete the event instances if it's a recurring event and requested
    if (existingEvent.isRecurring && deleteAllInstances) {
      await prisma.event.deleteMany({
        where: { parentEventId: id },
      });
    }

    // Delete the event
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

// PATCH handler for attendance operations (join/leave)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...operationData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const validatedOperation = attendanceOperationSchema.parse(operationData);
    const { operation } = validatedOperation;

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: {
          where: { id: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    switch (operation) {
      case "join":
        // Check if the user is already attending
        if (event.attendees && event.attendees.length > 0) {
          return NextResponse.json(
            { error: "You are already attending this event" },
            { status: 400 }
          );
        }

        // Check if event is in the past
        if (new Date(event.startTime) < new Date()) {
          return NextResponse.json(
            { error: "Cannot join past events" },
            { status: 400 }
          );
        }

        // Add the user to the event attendees
        await prisma.event.update({
          where: { id },
          data: {
            attendees: {
              connect: { id: session.user.id },
            },
          },
        });

        // Create a notification for the event organizer
        if (event.organizerId !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: "event",
              message: `${session.user.name || "Someone"} is attending your event`,
              userId: event.organizerId,
              relatedId: id,
            },
          });
        }

        return NextResponse.json({ success: true, operation: "joined" });

      case "leave":
        // Check if the user is attending
        if (!event.attendees || event.attendees.length === 0) {
          return NextResponse.json(
            { error: "You are not attending this event" },
            { status: 400 }
          );
        }

        // Remove the user from the event attendees
        await prisma.event.update({
          where: { id },
          data: {
            attendees: {
              disconnect: { id: session.user.id },
            },
            // Update participation response if exists
            participationResponses: {
              upsert: {
                where: {
                  eventId_userId: {
                    eventId: id,
                    userId: session.user.id
                  }
                },
                create: {
                  userId: session.user.id,
                  response: "not_attending"
                },
                update: {
                  response: "not_attending"
                }
              }
            }
          },
        });

        return NextResponse.json({ success: true, operation: "left" });

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error performing event attendance operation:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
} 