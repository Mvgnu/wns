import { EventAttendanceAction, EventRSVPStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// feature: event-rsvp-management
// intent: centralize RSVP, waitlist, and attendance state transitions for events.

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;

type CapacitySnapshot = {
  confirmed: number;
  waitlisted: number;
  capacity: number | null;
  isFull: boolean;
};

type RsvpResult = {
  status: EventRSVPStatus;
  waitlisted: boolean;
  promotedUserId?: string;
};

export class RsvpError extends Error {
  code:
    | "EVENT_NOT_FOUND"
    | "ALREADY_CONFIRMED"
    | "WAITLIST_DISABLED"
    | "NOT_ATTENDING"
    | "ORGANIZER_CANNOT_LEAVE"
    | "ALREADY_CHECKED_IN"
    | "NOT_WAITLISTED"
    | "INVALID_FEEDBACK_RATING";

  constructor(message: string, code: RsvpError["code"]) {
    super(message);
    this.name = "RsvpError";
    this.code = code;
  }
}

export async function getCapacitySnapshot(eventId: string, tx: PrismaClientOrTx = prisma): Promise<CapacitySnapshot> {
  const [event, confirmedCount, waitlistedCount] = await Promise.all([
    tx.event.findUnique({
      where: { id: eventId },
      select: { maxAttendees: true },
    }),
    tx.eventRSVP.count({ where: { eventId, status: EventRSVPStatus.CONFIRMED } }),
    tx.eventRSVP.count({ where: { eventId, status: EventRSVPStatus.WAITLISTED } }),
  ]);

  if (!event) {
    throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
  }

  const capacity = event.maxAttendees ?? null;
  const isFull = capacity !== null ? confirmedCount >= capacity : false;

  return {
    confirmed: confirmedCount,
    waitlisted: waitlistedCount,
    capacity,
    isFull,
  };
}

async function writeAttendanceLog(
  eventId: string,
  userId: string,
  action: EventAttendanceAction,
  tx: Prisma.TransactionClient,
  reason?: string,
  metadata?: Prisma.JsonValue,
) {
  await tx.eventAttendanceLog.create({
    data: {
      eventId,
      userId,
      action,
      reason,
      metadata,
    },
  });
}

export function mapStatusToAttendanceAction(status: EventRSVPStatus): EventAttendanceAction {
  switch (status) {
    case EventRSVPStatus.CHECKED_IN:
      return EventAttendanceAction.CHECKED_IN;
    case EventRSVPStatus.NO_SHOW:
      return EventAttendanceAction.MARKED_NO_SHOW;
    case EventRSVPStatus.WAITLISTED:
      return EventAttendanceAction.RSVP_WAITLISTED;
    case EventRSVPStatus.CANCELLED:
      return EventAttendanceAction.RSVP_CANCELLED;
    default:
      return EventAttendanceAction.RSVP_CONFIRMED;
  }
}

export async function commitRsvp(eventId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
        maxAttendees: true,
        waitlistEnabled: true,
      },
    });

    if (!event) {
      throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
    }

    if (event.organizerId === userId) {
      // Organizers are implicitly confirmed; ensure record exists but do not treat as error.
      const now = new Date();
      const rsvp = await tx.eventRSVP.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: {
          eventId,
          userId,
          status: EventRSVPStatus.CONFIRMED,
          confirmedAt: now,
        },
        update: {
          status: EventRSVPStatus.CONFIRMED,
          confirmedAt: now,
          cancelledAt: null,
          waitlistedAt: null,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: {
          attendees: {
            connect: { id: userId },
          },
        },
      });

      await writeAttendanceLog(eventId, userId, EventAttendanceAction.RSVP_CONFIRMED, tx);
      return { status: EventRSVPStatus.CONFIRMED, waitlisted: false } satisfies RsvpResult;
    }

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing?.status === EventRSVPStatus.CONFIRMED) {
      throw new RsvpError("User already confirmed for this event", "ALREADY_CONFIRMED");
    }

    const snapshot = await getCapacitySnapshot(eventId, tx);
    const now = new Date();
    const shouldWaitlist = snapshot.capacity !== null && snapshot.confirmed >= snapshot.capacity;

    if (shouldWaitlist && !event.waitlistEnabled) {
      throw new RsvpError("Event capacity reached and waitlist disabled", "WAITLIST_DISABLED");
    }

    const targetStatus = shouldWaitlist ? EventRSVPStatus.WAITLISTED : EventRSVPStatus.CONFIRMED;

    const rsvp = await tx.eventRSVP.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        status: targetStatus,
        waitlistedAt: targetStatus === EventRSVPStatus.WAITLISTED ? now : null,
        confirmedAt: targetStatus === EventRSVPStatus.CONFIRMED ? now : null,
      },
      update: {
        status: targetStatus,
        waitlistedAt: targetStatus === EventRSVPStatus.WAITLISTED ? now : null,
        confirmedAt: targetStatus === EventRSVPStatus.CONFIRMED ? now : existing?.confirmedAt ?? now,
        cancelledAt: null,
      },
    });

    if (targetStatus === EventRSVPStatus.CONFIRMED) {
      await tx.event.update({
        where: { id: eventId },
        data: {
          attendees: {
            connect: { id: userId },
          },
          isSoldOut: snapshot.capacity !== null ? snapshot.confirmed + (existing?.status === EventRSVPStatus.CONFIRMED ? 0 : 1) >= snapshot.capacity : false,
        },
      });
    } else {
      await tx.event.update({
        where: { id: eventId },
        data: {
          attendees: {
            disconnect: { id: userId },
          },
        },
      });
    }

    await writeAttendanceLog(eventId, userId, mapStatusToAttendanceAction(targetStatus), tx);

    return { status: rsvp.status, waitlisted: targetStatus === EventRSVPStatus.WAITLISTED } satisfies RsvpResult;
  });
}

async function promoteNextWaitlisted(eventId: string, tx: Prisma.TransactionClient) {
  const nextWaitlisted = await tx.eventRSVP.findFirst({
    where: { eventId, status: EventRSVPStatus.WAITLISTED },
    orderBy: { waitlistedAt: "asc" },
  });

  if (!nextWaitlisted) {
    return undefined;
  }

  const now = new Date();
  await tx.eventRSVP.update({
    where: { eventId_userId: { eventId, userId: nextWaitlisted.userId } },
    data: {
      status: EventRSVPStatus.CONFIRMED,
      confirmedAt: now,
    },
  });

  const snapshot = await getCapacitySnapshot(eventId, tx);

  await tx.event.update({
    where: { id: eventId },
    data: {
      attendees: {
        connect: { id: nextWaitlisted.userId },
      },
      isSoldOut: snapshot.capacity !== null ? snapshot.confirmed >= snapshot.capacity : false,
    },
  });

  await writeAttendanceLog(eventId, nextWaitlisted.userId, EventAttendanceAction.RSVP_CONFIRMED, tx, "waitlist-promoted");

  return nextWaitlisted.userId;
}

export async function cancelRsvp(eventId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        maxAttendees: true,
      },
    });

    if (!event) {
      throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
    }

    if (event.organizerId === userId) {
      throw new RsvpError("Organizers cannot leave their own events", "ORGANIZER_CANNOT_LEAVE");
    }

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!existing || existing.status === EventRSVPStatus.CANCELLED) {
      throw new RsvpError("User is not currently attending", "NOT_ATTENDING");
    }

    await tx.eventRSVP.update({
      where: { eventId_userId: { eventId, userId } },
      data: {
        status: EventRSVPStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          disconnect: { id: userId },
        },
      },
    });

    await writeAttendanceLog(eventId, userId, EventAttendanceAction.RSVP_CANCELLED, tx);

    const promotedUserId = await promoteNextWaitlisted(eventId, tx);

    if (event.maxAttendees) {
      const snapshot = await getCapacitySnapshot(eventId, tx);
      await tx.event.update({
        where: { id: eventId },
        data: {
          isSoldOut: snapshot.capacity !== null ? snapshot.confirmed >= snapshot.capacity : false,
        },
      });
    }

    return { status: EventRSVPStatus.CANCELLED, waitlisted: false, promotedUserId } satisfies RsvpResult;
  });
}

export async function buildAttendanceSummary(eventId: string, tx: PrismaClientOrTx = prisma) {
  const snapshot = await getCapacitySnapshot(eventId, tx);
  return {
    confirmedCount: snapshot.confirmed,
    waitlistCount: snapshot.waitlisted,
    capacity: snapshot.capacity,
    isFull: snapshot.isFull,
  };
}

export async function listEventRsvps(eventId: string) {
  const rsvps = await prisma.eventRSVP.findMany({
    where: { eventId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rsvps.map((entry) => ({
    id: entry.id,
    eventId: entry.eventId,
    user: entry.user,
    status: entry.status,
    waitlistedAt: entry.waitlistedAt,
    confirmedAt: entry.confirmedAt,
    cancelledAt: entry.cancelledAt,
    checkedInAt: entry.checkedInAt,
  }));
}

async function verifyOrganizerPrivileges(eventId: string, actorId: string, tx: Prisma.TransactionClient) {
  const event = await tx.event.findUnique({
    where: { id: eventId },
    select: {
      organizerId: true,
      coOrganizers: { select: { userId: true } },
    },
  });

  if (!event) {
    throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
  }

  const isOrganizer =
    event.organizerId === actorId || event.coOrganizers.some((co) => co.userId === actorId);

  if (!isOrganizer) {
    throw new RsvpError("User lacks organizer privileges", "ORGANIZER_CANNOT_LEAVE");
  }
}

export async function organizerConfirmRsvp(eventId: string, targetUserId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await verifyOrganizerPrivileges(eventId, actorId, tx);

    const snapshot = await getCapacitySnapshot(eventId, tx);

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId: targetUserId } },
    });

    if (snapshot.capacity !== null && snapshot.confirmed >= snapshot.capacity && existing?.status !== EventRSVPStatus.CONFIRMED) {
      throw new RsvpError("Event capacity reached", "WAITLIST_DISABLED");
    }

    const now = new Date();
    await tx.eventRSVP.upsert({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      create: {
        eventId,
        userId: targetUserId,
        status: EventRSVPStatus.CONFIRMED,
        confirmedAt: now,
      },
      update: {
        status: EventRSVPStatus.CONFIRMED,
        confirmedAt: now,
        cancelledAt: null,
        waitlistedAt: null,
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        attendees: { connect: { id: targetUserId } },
        isSoldOut: snapshot.capacity !== null ? snapshot.confirmed + (existing?.status === EventRSVPStatus.CONFIRMED ? 0 : 1) >= snapshot.capacity : false,
      },
    });

    await writeAttendanceLog(
      eventId,
      targetUserId,
      EventAttendanceAction.RSVP_CONFIRMED,
      tx,
      "organizer-confirmed",
      { actorId },
    );

    return buildAttendanceSummary(eventId, tx);
  });
}

export async function organizerWaitlistRsvp(eventId: string, targetUserId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await verifyOrganizerPrivileges(eventId, actorId, tx);

    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { waitlistEnabled: true },
    });

    if (!event) {
      throw new RsvpError("Event not found", "EVENT_NOT_FOUND");
    }

    if (!event.waitlistEnabled) {
      throw new RsvpError("Waitlist disabled", "WAITLIST_DISABLED");
    }

    const now = new Date();

    await tx.eventRSVP.upsert({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      create: {
        eventId,
        userId: targetUserId,
        status: EventRSVPStatus.WAITLISTED,
        waitlistedAt: now,
      },
      update: {
        status: EventRSVPStatus.WAITLISTED,
        waitlistedAt: now,
        confirmedAt: null,
        cancelledAt: null,
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        attendees: { disconnect: { id: targetUserId } },
        isSoldOut: false,
      },
    });

    await writeAttendanceLog(
      eventId,
      targetUserId,
      EventAttendanceAction.RSVP_WAITLISTED,
      tx,
      "organizer-waitlisted",
      { actorId },
    );

    return buildAttendanceSummary(eventId, tx);
  });
}

export async function organizerCancelRsvp(eventId: string, targetUserId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await verifyOrganizerPrivileges(eventId, actorId, tx);

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId: targetUserId } },
    });

    if (!existing || existing.status === EventRSVPStatus.CANCELLED) {
      throw new RsvpError("User is not currently attending", "NOT_ATTENDING");
    }

    await tx.eventRSVP.update({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      data: {
        status: EventRSVPStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        attendees: { disconnect: { id: targetUserId } },
      },
    });

    await writeAttendanceLog(
      eventId,
      targetUserId,
      EventAttendanceAction.RSVP_CANCELLED,
      tx,
      "organizer-cancelled",
      { actorId },
    );

    await promoteNextWaitlisted(eventId, tx);

    return buildAttendanceSummary(eventId, tx);
  });
}

export async function checkInAttendee(eventId: string, targetUserId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await verifyOrganizerPrivileges(eventId, actorId, tx);

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId: targetUserId } },
    });

    if (!existing || existing.status === EventRSVPStatus.CANCELLED) {
      throw new RsvpError("User is not currently attending", "NOT_ATTENDING");
    }

    if (existing.status === EventRSVPStatus.CHECKED_IN) {
      throw new RsvpError("User already checked in", "ALREADY_CHECKED_IN");
    }

    if (existing.status === EventRSVPStatus.WAITLISTED) {
      throw new RsvpError("User remains on the waitlist", "NOT_WAITLISTED");
    }

    const now = new Date();

    await tx.eventRSVP.update({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      data: {
        status: EventRSVPStatus.CHECKED_IN,
        checkedInAt: now,
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        attendees: { connect: { id: targetUserId } },
      },
    });

    await writeAttendanceLog(
      eventId,
      targetUserId,
      EventAttendanceAction.CHECKED_IN,
      tx,
      "checked-in",
      { actorId },
    );

    return buildAttendanceSummary(eventId, tx);
  });
}

export async function markNoShow(eventId: string, targetUserId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await verifyOrganizerPrivileges(eventId, actorId, tx);

    const existing = await tx.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId: targetUserId } },
    });

    if (!existing || existing.status === EventRSVPStatus.CANCELLED) {
      throw new RsvpError("User is not currently attending", "NOT_ATTENDING");
    }

    await tx.eventRSVP.update({
      where: { eventId_userId: { eventId, userId: targetUserId } },
      data: {
        status: EventRSVPStatus.NO_SHOW,
      },
    });

    await writeAttendanceLog(
      eventId,
      targetUserId,
      EventAttendanceAction.MARKED_NO_SHOW,
      tx,
      "no-show",
      { actorId },
    );

    return buildAttendanceSummary(eventId, tx);
  });
}

export async function upsertEventFeedback(eventId: string, userId: string, rating: number, comment?: string) {
  if (rating < 1 || rating > 5) {
    throw new RsvpError("Rating must be between 1 and 5", "INVALID_FEEDBACK_RATING");
  }

  return prisma.eventFeedback.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, rating, comment },
    update: { rating, comment },
  });
}

export async function listEventFeedback(eventId: string) {
  return prisma.eventFeedback.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function sweepWaitlistForEvent(eventId: string) {
  return prisma.$transaction(async (tx) => {
    let promoted = 0;
    while (true) {
      const snapshot = await getCapacitySnapshot(eventId, tx);

      if (snapshot.capacity === null || snapshot.confirmed >= snapshot.capacity) {
        break;
      }

      const promotedUserId = await promoteNextWaitlisted(eventId, tx);
      if (!promotedUserId) {
        break;
      }
      promoted += 1;
    }

    return promoted;
  });
}

export async function sweepWaitlistsForUpcomingEvents(hoursAhead = 24) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      startTime: { gte: now, lte: windowEnd },
      waitlistEnabled: true,
      maxAttendees: { not: null },
      rsvps: { some: { status: EventRSVPStatus.WAITLISTED } },
    },
    select: { id: true },
  });

  const promotionResults = [] as Array<{ eventId: string; promoted: number }>;

  for (const event of events) {
    const promoted = await sweepWaitlistForEvent(event.id);
    if (promoted > 0) {
      promotionResults.push({ eventId: event.id, promoted });
    }
  }

  return promotionResults;
}
