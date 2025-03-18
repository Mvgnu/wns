import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addDays, eachDayOfInterval, format, isBefore, parseISO } from "date-fns";

// Validation schema for creating recurring events
const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format").optional().nullable(),
  locationId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  
  // Recurring event fields
  isRecurring: z.literal(true), // Must be true for this endpoint
  recurringPattern: z.enum(["weekly", "monthly"]), 
  recurringDays: z.array(z.number()),
  recurringEndDate: z.string().datetime("Invalid end date format").optional(),
  
  // Optional advanced settings
  image: z.string().optional().nullable(),
});

// Maximum allowed recurring instances to prevent abuse
const MAX_ALLOWED_INSTANCES = 100;

/**
 * POST handler for creating recurring events
 * Will create a parent event and store the pattern information
 * Actual instances are generated on-demand via the instances API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const validatedData = createEventSchema.parse(body);
    
    // Verify end date is after start date
    const startTime = new Date(validatedData.startTime);
    let endTime = null;
    if (validatedData.endTime) {
      endTime = new Date(validatedData.endTime);
      if (isBefore(endTime, startTime)) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }
    
    // Check recurring end date
    let recurringEndDate = null;
    if (validatedData.recurringEndDate) {
      recurringEndDate = new Date(validatedData.recurringEndDate);
      
      // End date must be in the future
      if (isBefore(recurringEndDate, new Date())) {
        return NextResponse.json(
          { error: "Recurring end date must be in the future" },
          { status: 400 }
        );
      }
      
      // For safety, limit how far into the future events can recur
      const maxAllowedDate = addDays(new Date(), 365 * 2); // 2 years in the future
      if (isBefore(maxAllowedDate, recurringEndDate)) {
        return NextResponse.json(
          { error: "Recurring end date cannot be more than 2 years in the future" },
          { status: 400 }
        );
      }
      
      // Validate recurring days based on pattern
      if (validatedData.recurringPattern === "weekly") {
        // Weekly pattern: days 0-6 (Sunday to Saturday)
        const invalidDays = validatedData.recurringDays.filter(day => day < 0 || day > 6);
        if (invalidDays.length > 0) {
          return NextResponse.json(
            { error: "Weekly recurring days must be between 0 (Sunday) and 6 (Saturday)" },
            { status: 400 }
          );
        }
      } else if (validatedData.recurringPattern === "monthly") {
        // Monthly pattern: days 1-31
        const invalidDays = validatedData.recurringDays.filter(day => day < 1 || day > 31);
        if (invalidDays.length > 0) {
          return NextResponse.json(
            { error: "Monthly recurring days must be between 1 and 31" },
            { status: 400 }
          );
        }
      }
      
      // Make sure we're not creating too many instances (to prevent abuse)
      const estimatedInstanceCount = calculateEstimatedInstanceCount(
        startTime, 
        recurringEndDate, 
        validatedData.recurringPattern, 
        validatedData.recurringDays
      );
      
      if (estimatedInstanceCount > MAX_ALLOWED_INSTANCES) {
        return NextResponse.json(
          { 
            error: `This recurring pattern would create approximately ${estimatedInstanceCount} instances, ` +
                  `which exceeds the maximum allowed (${MAX_ALLOWED_INSTANCES}). ` +
                  `Please use a shorter recurring period or fewer days per period.` 
          },
          { status: 400 }
        );
      }
    }
    
    // Check permissions for group events
    if (validatedData.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: validatedData.groupId },
        select: { ownerId: true, id: true },
      });
      
      if (!group) {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 }
        );
      }
      
      // Check if user is group owner or member
      const userCanCreateInGroup = await prisma.group.findFirst({
        where: {
          id: validatedData.groupId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } },
          ],
        },
      });
      
      if (!userCanCreateInGroup) {
        return NextResponse.json(
          { error: "You don't have permission to create events in this group" },
          { status: 403 }
        );
      }
    }
    
    // Create the recurring event (template)
    const newEvent = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime,
        endTime,
        image: validatedData.image,
        
        // Recurring fields
        isRecurring: true,
        recurringPattern: validatedData.recurringPattern,
        recurringDays: validatedData.recurringDays,
        recurringEndDate,
        
        // Relationships
        organizer: {
          connect: { id: session.user.id },
        },
        ...(validatedData.groupId && {
          group: {
            connect: { id: validatedData.groupId },
          },
        }),
        ...(validatedData.locationId && {
          location: {
            connect: { id: validatedData.locationId },
          },
        }),
      },
    });
    
    // Return the created event with next few instances generated
    // (but don't store instances in DB - they're generated on-demand)
    const nextInstances = generateNextEventInstances(
      newEvent,
      new Date(),
      addDays(new Date(), 30) // Next 30 days of instances
    );
    
    return NextResponse.json({
      event: newEvent,
      instances: nextInstances,
      message: "Recurring event created successfully",
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating recurring event:", error);
    return NextResponse.json(
      { error: "Failed to create recurring event" },
      { status: 500 }
    );
  }
}

/**
 * Calculate estimated number of instances this pattern would create
 * Used to prevent abuse of the system
 */
function calculateEstimatedInstanceCount(
  startDate: Date, 
  endDate: Date, 
  pattern: string, 
  days: number[]
): number {
  if (!endDate) {
    // Without an end date, we use a default period to estimate
    endDate = addDays(startDate, 365); // 1 year maximum
  }
  
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (pattern === "weekly") {
    // For weekly pattern: (# of days in range / 7) * (# of days per week selected)
    const weeks = Math.ceil(dayCount / 7);
    return weeks * days.length;
  } else if (pattern === "monthly") {
    // For monthly pattern: (# of months in range) * (# of days per month selected)
    const months = Math.ceil(dayCount / 30);
    return months * days.length;
  }
  
  return 0;
}

/**
 * Generate the next few instances of a recurring event
 * This is for preview only and doesn't create DB entries
 */
function generateNextEventInstances(event: any, startDate: Date, endDate: Date) {
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
        });
      }
    }
  }
  
  return instances;
} 