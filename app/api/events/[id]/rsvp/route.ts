import { NextRequest, NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import { prisma } from "@/lib/prisma";
import {
  buildAttendanceSummary,
  checkInAttendee,
  listEventFeedback,
  listEventRsvps,
  markNoShow,
  organizerCancelRsvp,
  organizerConfirmRsvp,
  organizerWaitlistRsvp,
  RsvpError,
  sweepWaitlistForEvent,
  upsertEventFeedback,
} from "@/lib/events/rsvp";

// feature: event-rsvp-management
// intent: expose organizer-grade RSVP controls for attendance and feedback workflows.

async function assertOrganizer(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, coOrganizers: { select: { userId: true } } },
  });

  if (!event) {
    throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
  }

  const isOrganizer =
    event.organizerId === userId || event.coOrganizers.some((co) => co.userId === userId);

  if (!isOrganizer) {
    throw new RsvpError("User lacks organizer privileges", "ORGANIZER_CANNOT_LEAVE");
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSafeServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    await assertOrganizer(eventId, session.user.id);

    const [rsvps, summary, feedback] = await Promise.all([
      listEventRsvps(eventId),
      buildAttendanceSummary(eventId),
      listEventFeedback(eventId),
    ]);

    const averageRating =
      feedback.length > 0
        ? feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.length
        : null;

    return NextResponse.json({
      rsvps,
      summary,
      feedback,
      meta: {
        totalRsvps: rsvps.length,
        totalFeedback: feedback.length,
        averageRating,
      },
    });
  } catch (error) {
    if (error instanceof RsvpError) {
      const statusCode =
        error.code === "EVENT_NOT_FOUND" ? 404 : error.code === "ORGANIZER_CANNOT_LEAVE" ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
    }

    console.error("Failed to load RSVP control data", error);
    return NextResponse.json({ error: "Failed to load RSVP data" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSafeServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { action, targetUserId, rating, comment } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    let summary;
    let rsvps;

    switch (action) {
      case "confirm": {
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }
        summary = await organizerConfirmRsvp(eventId, targetUserId, session.user.id);
        break;
      }
      case "waitlist": {
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }
        summary = await organizerWaitlistRsvp(eventId, targetUserId, session.user.id);
        break;
      }
      case "cancel": {
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }
        summary = await organizerCancelRsvp(eventId, targetUserId, session.user.id);
        break;
      }
      case "check-in": {
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }
        summary = await checkInAttendee(eventId, targetUserId, session.user.id);
        break;
      }
      case "no-show": {
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }
        summary = await markNoShow(eventId, targetUserId, session.user.id);
        break;
      }
      case "sweep-waitlist": {
        await assertOrganizer(eventId, session.user.id);
        await sweepWaitlistForEvent(eventId);
        summary = await buildAttendanceSummary(eventId);
        break;
      }
      case "feedback": {
        const subjectUserId = targetUserId ?? session.user.id;
        if (!subjectUserId) {
          return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
        }

        if (subjectUserId !== session.user.id) {
          await assertOrganizer(eventId, session.user.id);
        }

        if (typeof rating !== "number") {
          return NextResponse.json({ error: "rating required" }, { status: 400 });
        }

        await upsertEventFeedback(eventId, subjectUserId, rating, comment);
        summary = await buildAttendanceSummary(eventId);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    rsvps = await listEventRsvps(eventId);
    const feedback = await listEventFeedback(eventId);

    const averageRating =
      feedback.length > 0
        ? feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.length
        : null;

    return NextResponse.json({
      success: true,
      action,
      summary,
      rsvps,
      feedback,
      meta: {
        totalRsvps: rsvps.length,
        totalFeedback: feedback.length,
        averageRating,
      },
    });
  } catch (error) {
    if (error instanceof RsvpError) {
      let statusCode = 400;
      switch (error.code) {
        case "EVENT_NOT_FOUND":
          statusCode = 404;
          break;
        case "ORGANIZER_CANNOT_LEAVE":
          statusCode = 403;
          break;
        case "ALREADY_CONFIRMED":
        case "ALREADY_CHECKED_IN":
        case "NOT_ATTENDING":
        case "NOT_WAITLISTED":
        case "WAITLIST_DISABLED":
        case "INVALID_FEEDBACK_RATING":
          statusCode = 409;
          break;
        default:
          statusCode = 400;
      }
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
    }

    console.error("RSVP management request failed", error);
    return NextResponse.json({ error: "Failed to update RSVP" }, { status: 500 });
  }
}
