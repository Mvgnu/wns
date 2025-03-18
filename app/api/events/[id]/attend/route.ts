import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";

// POST handler for joining an event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have the eventId before proceeding
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is already attending
    const isAttending = await prisma.event.findFirst({
      where: {
        id: eventId,
        attendees: {
          some: { id: userId },
        },
      },
    });

    if (isAttending) {
      return NextResponse.json(
        { error: "Already attending this event" },
        { status: 400 }
      );
    }

    // Add user as an attendee
    await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          connect: { id: userId },
        },
      },
    });

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: event.organizerId,
        type: "EVENT_JOIN",
        message: `${session.user.name || "Someone"} is now attending your event: ${event.title}`,
        linkUrl: `/events/${eventId}`,
        actorId: userId,
        read: false,
      },
    });

    // Send real-time notification to event organizer
    if (event.organizerId !== userId) {
      sendNotificationToUser(event.organizerId, notification);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining event:", error);
    return NextResponse.json(
      { error: "Failed to join event" },
      { status: 500 }
    );
  }
}

// DELETE handler for leaving an event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have the eventId before proceeding
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is the organizer (can't leave your own event)
    if (event.organizerId === userId) {
      return NextResponse.json(
        { error: "Organizers cannot leave their own events" },
        { status: 400 }
      );
    }

    // Check if user is attending
    const isAttending = await prisma.event.findFirst({
      where: {
        id: eventId,
        attendees: {
          some: { id: userId },
        },
      },
    });

    if (!isAttending) {
      return NextResponse.json(
        { error: "Not attending this event" },
        { status: 400 }
      );
    }

    // Remove user from attendees
    await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          disconnect: { id: userId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
} 