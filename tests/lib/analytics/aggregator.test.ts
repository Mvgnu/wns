import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { EventAttendanceAction, MembershipStatus, type PrismaClient } from '@prisma/client';
import { generateDailyAnalyticsSnapshot, mergeGroupMetric } from '@/lib/analytics/aggregator';

describe('mergeGroupMetric', () => {
  it('merges additive metrics while preserving snapshots', () => {
    const base = { activeMembers: 5, newMembers: 1, eventsHosted: 2, attendance: 3, feedbackCount: 1 };
    const merged = mergeGroupMetric(base, { newMembers: 4, attendance: 2 });

    expect(merged).toEqual({
      activeMembers: 5,
      newMembers: 5,
      eventsHosted: 2,
      attendance: 5,
      feedbackCount: 1
    });
  });
});

describe('generateDailyAnalyticsSnapshot', () => {
  const originalSkip = process.env.SKIP_DATABASE_CALLS;

  beforeEach(() => {
    process.env.SKIP_DATABASE_CALLS = 'false';
  });

  afterEach(() => {
    process.env.SKIP_DATABASE_CALLS = originalSkip;
  });

  it('aggregates metrics through the provided client facade', async () => {
    const dailyUpsert = vi.fn().mockResolvedValue({
      id: 'metric-1',
      snapshotDate: new Date('2024-03-12T00:00:00Z'),
      activeMembers: 3,
      newMembers: 2,
      eventsCreated: 1,
      rsvpTotal: 4,
      checkIns: 3,
      feedbackCount: 1
    });

    const groupUpsert = vi.fn().mockImplementation(async ({ create }) => ({ id: 'g-metric', ...create }));

    const attendanceFindMany = vi.fn().mockImplementation((args) => {
      if ('distinct' in args) {
        return Promise.resolve([{ userId: 'user-1' }, { userId: 'user-2' }]);
      }
      return Promise.resolve([
        { event: { groupId: 'group-1' }, userId: 'user-1' },
        { event: { groupId: 'group-1' }, userId: 'user-2' },
        { event: { groupId: 'group-2' }, userId: 'user-3' }
      ]);
    });

    const groupByMembership = vi.fn().mockImplementation((args) => {
      if (args.where?.startedAt?.gte) {
        return Promise.resolve([{ groupId: 'group-1', _count: { _all: 2 } }]);
      }
      return Promise.resolve([
        { groupId: 'group-1', _count: { _all: 10 } },
        { groupId: 'group-2', _count: { _all: 4 } }
      ]);
    });

    const mockClient = {
      user: { count: vi.fn().mockResolvedValue(2) },
      event: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ groupId: 'group-1' }, { groupId: 'group-2' }])
      },
      eventRSVP: { count: vi.fn().mockResolvedValue(4) },
      eventAttendanceLog: { findMany: attendanceFindMany },
      groupMessage: { findMany: vi.fn().mockResolvedValue([{ authorId: 'user-4' }]) },
      groupMembership: { groupBy: groupByMembership },
      eventFeedback: {
        findMany: vi.fn().mockResolvedValue([
          { event: { groupId: 'group-1' } },
          { event: { groupId: 'group-2' } }
        ])
      },
      dailyPlatformMetric: { upsert: dailyUpsert },
      groupDailyMetric: { upsert: groupUpsert }
    } as unknown as PrismaClient;

    const result = await generateDailyAnalyticsSnapshot(new Date('2024-03-12T05:00:00Z'), mockClient);

    expect(dailyUpsert).toHaveBeenCalledTimes(1);
    expect(groupUpsert).toHaveBeenCalledTimes(2);
    expect(result.platformMetric).toEqual({
      activeMembers: 3,
      newMembers: 2,
      eventsCreated: 1,
      rsvpTotal: 4,
      checkIns: 3,
      feedbackCount: 1
    });
    expect(result.groupCount).toBe(2);

    const attendanceArgs = attendanceFindMany.mock.calls;
    expect(attendanceArgs).toHaveLength(2);
    expect(attendanceArgs[0][0].where).toMatchObject({ action: EventAttendanceAction.CHECKED_IN });
    expect(attendanceArgs[1][0].where).toMatchObject({ action: { in: [EventAttendanceAction.CHECKED_IN, EventAttendanceAction.RSVP_CONFIRMED] } });

    const membershipCalls = groupByMembership.mock.calls;
    expect(membershipCalls).toHaveLength(2);
    expect(membershipCalls[0][0].where).toMatchObject({ status: MembershipStatus.active });
    expect(membershipCalls[1][0].where).toMatchObject({ status: MembershipStatus.active });
  });
});
