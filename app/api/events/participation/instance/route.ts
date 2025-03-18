import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { format } from "date-fns";

// Schema for participation response
const participationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  response: z.enum(["yes", "no", "maybe"], {
    errorMap: () => ({ message: "Response must be 'yes', 'no', or 'maybe'" }),
  }),
  date: z.string().datetime("Invalid date format"),
});

// POST handler for creating/updating participation responses for a specific instance
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
    const validatedData = participationSchema.parse(body);
    const instanceDate = new Date(validatedData.date);

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        group: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify this is a recurring event
    if (!event.isRecurring) {
      return NextResponse.json(
        { error: "This API is only for recurring event instances" },
        { status: 400 }
      );
    }

    // Check if the user is allowed to respond to this event
    // If the event is part of a private group, the user must be a member
    if ((event.group as any)?.isPrivate) {
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
          { error: "You are not authorized to respond to this event" },
          { status: 403 }
        );
      }
    }

    // Create or update the event instance response using the proper model
    // Fix: Use EventInstanceResponse instead of ParticipationResponse
    try {
      const response = await prisma.eventInstanceResponse.upsert({
        where: {
          userId_eventId_date: {
            eventId: validatedData.eventId,
            userId: session.user.id,
            date: instanceDate,
          },
        },
        update: {
          response: validatedData.response,
        },
        create: {
          eventId: validatedData.eventId,
          userId: session.user.id,
          response: validatedData.response,
          date: instanceDate,
        },
      });

      // IMPORTANT: We no longer modify the main event's attendees list
      // This ensures subevent attendance is completely independent

      // Track instance-specific attendance counts (for analytics)
      await updateInstanceAttendanceStats(validatedData.eventId, instanceDate);

      return NextResponse.json({
        success: true,
        data: response,
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { 
          error: "Failed to process participation response", 
          details: dbError.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error handling instance participation response:", error);
    return NextResponse.json(
      { error: "Failed to process participation response" },
      { status: 500 }
    );
  }
}

// Helper function to update attendance stats for an instance
async function updateInstanceAttendanceStats(eventId: string, instanceDate: Date) {
  try {
    // Count how many users responded "yes" to this specific instance
    const yesCount = await prisma.eventInstanceResponse.count({
      where: {
        eventId,
        date: {
          gte: new Date(new Date(instanceDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(instanceDate).setHours(23, 59, 59, 999)),
        },
        response: "yes",
      },
    });
    
    // Optional: store these counts for reporting/dashboards
    // We could create a new model for this if needed
    
    return yesCount;
  } catch (error) {
    console.error("Error updating instance attendance stats:", error);
    return 0;
  }
}

// GET handler for retrieving participation responses for a specific instance
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
    const eventId = searchParams.get("eventId");
    const dateStr = searchParams.get("date");

    if (!eventId || !dateStr) {
      return NextResponse.json(
        { error: "Event ID and date are required" },
        { status: 400 }
      );
    }

    const instanceDate = new Date(dateStr);

    // Check if the event exists and is a recurring event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!event.isRecurring) {
      return NextResponse.json(
        { error: "This API is only for recurring event instances" },
        { status: 400 }
      );
    }

    // Check if the user is allowed to view responses for this event
    // Only the event organizer or group owner/members can view responses
    const canViewResponses = 
      event.organizerId === session.user.id ||
      event.group?.ownerId === session.user.id ||
      await prisma.group.findFirst({
        where: {
          id: event.groupId as string,
          members: { some: { id: session.user.id } },
        },
      });

    if (!canViewResponses && (event.group as any)?.isPrivate) {
      return NextResponse.json(
        { error: "You are not authorized to view responses for this event" },
        { status: 403 }
      );
    }

    // Get all participation responses for the event instance
    const responses = await prisma.eventInstanceResponse.findMany({
      where: { 
        eventId,
        date: {
          gte: new Date(new Date(instanceDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(instanceDate).setHours(23, 59, 59, 999)),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get the user's own response
    const userResponse = await prisma.eventInstanceResponse.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        date: {
          gte: new Date(new Date(instanceDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(instanceDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    // Count responses by type
    const counts = {
      yes: responses.filter((r) => r.response === "yes").length,
      no: responses.filter((r) => r.response === "no").length,
      maybe: responses.filter((r) => r.response === "maybe").length,
      total: responses.length,
    };

    return NextResponse.json({
      responses,
      userResponse,
      counts,
    });
  } catch (error) {
    console.error("Error retrieving instance participation responses:", error);
    return NextResponse.json(
      { error: "Failed to retrieve participation responses" },
      { status: 500 }
    );
  }
} 