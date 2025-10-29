import { addDays, startOfDay } from 'date-fns';
import { EventAttendanceAction, MembershipStatus, type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

// feature: analytics-dashboard
// scope: lib-analytics

type GroupMetricAccumulator = {
  activeMembers: number;
  newMembers: number;
  eventsHosted: number;
  attendance: number;
  feedbackCount: number;
};

const GROUP_METRIC_DEFAULT: GroupMetricAccumulator = {
  activeMembers: 0,
  newMembers: 0,
  eventsHosted: 0,
  attendance: 0,
  feedbackCount: 0
};

// action: merge-group-metric
export function mergeGroupMetric(
  current: GroupMetricAccumulator,
  incoming: Partial<GroupMetricAccumulator>
): GroupMetricAccumulator {
  return {
    activeMembers: incoming.activeMembers ?? current.activeMembers,
    newMembers: current.newMembers + (incoming.newMembers ?? 0),
    eventsHosted: current.eventsHosted + (incoming.eventsHosted ?? 0),
    attendance: current.attendance + (incoming.attendance ?? 0),
    feedbackCount: current.feedbackCount + (incoming.feedbackCount ?? 0)
  };
}

function getOrCreateGroupMetric(map: Map<string, GroupMetricAccumulator>, groupId: string) {
  if (!map.has(groupId)) {
    map.set(groupId, { ...GROUP_METRIC_DEFAULT });
  }
  return map.get(groupId)!;
}

export type AnalyticsSnapshotResult = {
  platformMetric: {
    activeMembers: number;
    newMembers: number;
    eventsCreated: number;
    rsvpTotal: number;
    checkIns: number;
    feedbackCount: number;
  } | null;
  groupCount: number;
};

// action: aggregate-daily-snapshot
export async function generateDailyAnalyticsSnapshot(
  targetDate: Date = new Date(),
  client: PrismaClient = prisma
): Promise<AnalyticsSnapshotResult> {
  if (process.env.SKIP_DATABASE_CALLS === 'true') {
    return { platformMetric: null, groupCount: 0 };
  }

  const snapshotStart = startOfDay(targetDate);
  const snapshotEnd = addDays(snapshotStart, 1);

  const [
    newMemberCount,
    eventsCreated,
    rsvpTotal,
    attendanceLogs,
    attendanceForActivity,
    messageAuthors,
    activeMemberships,
    newMemberships,
    eventsHosted,
    feedbackEntries
  ] = await Promise.all([
    client.user.count({ where: { createdAt: { gte: snapshotStart, lt: snapshotEnd } } }),
    client.event.count({ where: { createdAt: { gte: snapshotStart, lt: snapshotEnd } } }),
    client.eventRSVP.count({ where: { createdAt: { gte: snapshotStart, lt: snapshotEnd } } }),
    client.eventAttendanceLog.findMany({
      where: {
        createdAt: { gte: snapshotStart, lt: snapshotEnd },
        action: EventAttendanceAction.CHECKED_IN,
        event: { groupId: { not: null } }
      },
      select: { event: { select: { groupId: true } }, userId: true }
    }),
    client.eventAttendanceLog.findMany({
      where: {
        createdAt: { gte: snapshotStart, lt: snapshotEnd },
        action: { in: [EventAttendanceAction.CHECKED_IN, EventAttendanceAction.RSVP_CONFIRMED] }
      },
      select: { userId: true },
      distinct: ['userId']
    }),
    client.groupMessage.findMany({
      where: { createdAt: { gte: snapshotStart, lt: snapshotEnd } },
      select: { authorId: true },
      distinct: ['authorId']
    }),
    client.groupMembership.groupBy({
      by: ['groupId'],
      where: {
        status: MembershipStatus.active,
        startedAt: { lte: snapshotEnd },
        OR: [{ expiresAt: null }, { expiresAt: { gte: snapshotStart } }]
      },
      _count: { _all: true }
    }),
    client.groupMembership.groupBy({
      by: ['groupId'],
      where: {
        status: MembershipStatus.active,
        startedAt: { gte: snapshotStart, lt: snapshotEnd }
      },
      _count: { _all: true }
    }),
    client.event.findMany({
      where: { groupId: { not: null }, startTime: { gte: snapshotStart, lt: snapshotEnd } },
      select: { groupId: true }
    }),
    client.eventFeedback.findMany({
      where: { createdAt: { gte: snapshotStart, lt: snapshotEnd } },
      select: { event: { select: { groupId: true } } }
    })
  ]);

  const activeMemberIds = new Set<string>();
  attendanceForActivity.forEach((entry) => {
    if (entry.userId) {
      activeMemberIds.add(entry.userId);
    }
  });
  messageAuthors.forEach((entry) => {
    if (entry.authorId) {
      activeMemberIds.add(entry.authorId);
    }
  });

  const platformMetric = await client.dailyPlatformMetric.upsert({
    where: { snapshotDate: snapshotStart },
    update: {
      activeMembers: activeMemberIds.size,
      newMembers: newMemberCount,
      eventsCreated,
      rsvpTotal,
      checkIns: attendanceLogs.length,
      feedbackCount: feedbackEntries.length
    },
    create: {
      snapshotDate: snapshotStart,
      activeMembers: activeMemberIds.size,
      newMembers: newMemberCount,
      eventsCreated,
      rsvpTotal,
      checkIns: attendanceLogs.length,
      feedbackCount: feedbackEntries.length
    }
  });

  const metricMap = new Map<string, GroupMetricAccumulator>();

  activeMemberships.forEach((row) => {
    if (!row.groupId) return;
    const current = getOrCreateGroupMetric(metricMap, row.groupId);
    metricMap.set(row.groupId, mergeGroupMetric(current, { activeMembers: row._count._all }));
  });

  newMemberships.forEach((row) => {
    if (!row.groupId) return;
    const current = getOrCreateGroupMetric(metricMap, row.groupId);
    metricMap.set(row.groupId, mergeGroupMetric(current, { newMembers: row._count._all }));
  });

  eventsHosted.forEach((row) => {
    if (!row.groupId) return;
    const current = getOrCreateGroupMetric(metricMap, row.groupId);
    metricMap.set(row.groupId, mergeGroupMetric(current, { eventsHosted: 1 }));
  });

  attendanceLogs.forEach((entry) => {
    const groupId = entry.event?.groupId;
    if (!groupId) return;
    const current = getOrCreateGroupMetric(metricMap, groupId);
    metricMap.set(groupId, mergeGroupMetric(current, { attendance: 1 }));
  });

  feedbackEntries.forEach((entry) => {
    const groupId = entry.event?.groupId;
    if (!groupId) return;
    const current = getOrCreateGroupMetric(metricMap, groupId);
    metricMap.set(groupId, mergeGroupMetric(current, { feedbackCount: 1 }));
  });

  const groupEntries = Array.from(metricMap.entries());
  if (groupEntries.length > 0) {
    await Promise.all(
      groupEntries.map(([groupId, metrics]) =>
        client.groupDailyMetric.upsert({
          where: { snapshotDate_groupId: { snapshotDate: snapshotStart, groupId } },
          update: metrics,
          create: { snapshotDate: snapshotStart, groupId, ...metrics }
        })
      )
    );
  }

  return {
    platformMetric: {
      activeMembers: platformMetric.activeMembers,
      newMembers: platformMetric.newMembers,
      eventsCreated: platformMetric.eventsCreated,
      rsvpTotal: platformMetric.rsvpTotal,
      checkIns: platformMetric.checkIns,
      feedbackCount: platformMetric.feedbackCount
    },
    groupCount: groupEntries.length
  };
}
