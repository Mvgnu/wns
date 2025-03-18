import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for participation response
const participationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  response: z.enum(["yes", "no", "maybe", "undetermined"], {
    errorMap: () => ({ message: "Response must be 'yes', 'no', 'maybe', or 'undetermined'" }),
  }),
});

// POST handler for creating/updating participation responses
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

    // Create or update the participation response
    const response = await prisma.participationResponse.upsert({
      where: {
        eventId_userId: {
          eventId: validatedData.eventId,
          userId: session.user.id,
        },
      },
      update: {
        response: validatedData.response,
      },
      create: {
        eventId: validatedData.eventId,
        userId: session.user.id,
        response: validatedData.response,
      },
    });

    // Manage the user's attendance based on their response
    if (validatedData.response === "yes") {
      // If the response is "yes", add the user to the event attendees
      await prisma.event.update({
        where: { id: validatedData.eventId },
        data: {
          attendees: {
            connect: { id: session.user.id },
          },
        },
      });
    } else if (validatedData.response === "no" || validatedData.response === "maybe" || validatedData.response === "undetermined") {
      // If the response is "no", "maybe", or "undetermined", remove the user from attendees
      await prisma.event.update({
        where: { id: validatedData.eventId },
        data: {
          attendees: {
            disconnect: { id: session.user.id },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error handling participation response:", error);
    return NextResponse.json(
      { error: "Failed to process participation response" },
      { status: 500 }
    );
  }
}

// GET handler for retrieving participation responses for an event
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

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if the event exists
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

    // Get all participation responses for the event
    const responses = await prisma.participationResponse.findMany({
      where: { eventId },
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
    const userResponse = await prisma.participationResponse.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    // If no response yet, create an undetermined response
    if (!userResponse) {
      // Create an undetermined response for the user
      await prisma.participationResponse.create({
        data: {
          eventId,
          userId: session.user.id,
          response: "undetermined"
        }
      });
    }

    // Count responses by type
    const counts = {
      yes: responses.filter((r: any) => r.response === "yes").length,
      no: responses.filter((r: any) => r.response === "no").length,
      maybe: responses.filter((r: any) => r.response === "maybe").length,
      undetermined: responses.filter((r: any) => r.response === "undetermined").length,
      total: responses.length,
    };

    return NextResponse.json({
      responses,
      userResponse: userResponse || { response: "undetermined" },
      counts,
    });
  } catch (error) {
    console.error("Error retrieving participation responses:", error);
    return NextResponse.json(
      { error: "Failed to retrieve participation responses" },
      { status: 500 }
    );
  }
} 