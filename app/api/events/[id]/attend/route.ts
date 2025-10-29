export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSafeServerSession } from "@/lib/sessionHelper";
import { sendNotificationToUser } from "@/lib/notificationService";
import { buildAttendanceSummary, cancelRsvp, commitRsvp, RsvpError } from "@/lib/events/rsvp";
import { EventRSVPStatus } from "@prisma/client";

// POST handler for joining an event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have the eventId before proceeding
    const { id: eventId } = params;
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const session = await getSafeServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        joinRestriction: true,
        groupId: true,
        group: true,
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

    // Access the join restriction directly (bypass TypeScript type checking)
    const joinRestriction = (event as any).joinRestriction;

    // Check join restrictions for group-only events
    if (joinRestriction === "groupOnly" && event.groupId) {
      // Check if user is a member of the group
      const isMember = await prisma.group.findFirst({
        where: {
          id: event.groupId,
          members: {
            some: { id: userId }
          }
        }
      });

      if (!isMember) {
        return NextResponse.json(
          { error: "You must be a member of the group to join this event" },
          { status: 403 }
        );
      }
    }

    try {
      const rsvpResult = await commitRsvp(eventId, userId);
      const summary = await buildAttendanceSummary(eventId);

      if (event.organizerId !== userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: event.organizerId,
            type: "EVENT_JOIN",
            message:
              rsvpResult.status === EventRSVPStatus.WAITLISTED
                ? `${session.user.name || "Someone"} joined the waitlist for your event: ${event.title}`
                : `${session.user.name || "Someone"} is now attending your event: ${event.title}`,
            linkUrl: `/events/${eventId}`,
            actorId: userId,
            read: false,
          },
        });

        sendNotificationToUser(event.organizerId, notification);
      }

      return NextResponse.json({
        success: true,
        status: rsvpResult.status,
        waitlisted: rsvpResult.waitlisted,
        summary,
      });
    } catch (error) {
      if (error instanceof RsvpError) {
        const statusCode =
          error.code === "WAITLIST_DISABLED" ? 409 : error.code === "ALREADY_CONFIRMED" ? 400 : 400;
        return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
      }
      throw error;
    }
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
    const { id: eventId } = params;
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const session = await getSafeServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    try {
      const result = await cancelRsvp(eventId, userId);
      const summary = await buildAttendanceSummary(eventId);
      return NextResponse.json({ success: true, status: result.status, summary, promotedUserId: result.promotedUserId });
    } catch (error) {
      if (error instanceof RsvpError) {
        const statusCode =
          error.code === "ORGANIZER_CANNOT_LEAVE" ? 400 : error.code === "NOT_ATTENDING" ? 400 : 404;
        return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
} 