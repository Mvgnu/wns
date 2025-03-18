export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET endpoint to fetch event attendees
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Fetch all attendees for the event
    const attendees = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        attendees: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Return the attendees array
    return NextResponse.json(attendees?.attendees || []);
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    return NextResponse.json(
      { error: "Failed to fetch event attendees" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a user as an attendee
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const userId = session.user.id;

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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
          some: {
            id: userId,
          },
        },
      },
    });

    if (isAttending) {
      return NextResponse.json(
        { error: "User is already attending this event" },
        { status: 400 }
      );
    }

    // Add user to event attendees
    await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          connect: { id: userId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding event attendee:", error);
    return NextResponse.json(
      { error: "Failed to add attendee to event" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a user as an attendee
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const eventId = params.id;
    const userId = session.user.id;

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is attending
    const isAttending = await prisma.event.findFirst({
      where: {
        id: eventId,
        attendees: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!isAttending) {
      return NextResponse.json(
        { error: "User is not attending this event" },
        { status: 400 }
      );
    }

    // Remove user from event attendees
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
    console.error("Error removing event attendee:", error);
    return NextResponse.json(
      { error: "Failed to remove attendee from event" },
      { status: 500 }
    );
  }
} 