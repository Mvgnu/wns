import { beforeEach, describe, expect, it, vi } from 'vitest';

const referralCodes = new Map<string, any>();
const referrals = new Map<string, any>();

function resetStores() {
  referralCodes.clear();
  referrals.clear();
}

function findReferralCodeById(id: string) {
  for (const value of referralCodes.values()) {
    if (value.id === id) {
      return value;
    }
  }
  return null;
}

vi.mock('@/lib/prisma', () => {
  const prisma = {
    referralCode: {
      findUnique: vi.fn(async ({ where }: any) => referralCodes.get(where.userId) ?? null),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const existing = referralCodes.get(where.userId);
        if (existing) {
          const next = {
            ...existing,
            ...update,
            updatedAt: new Date(),
            code: update.code ?? existing.code,
            active: update.active ?? existing.active,
          };
          referralCodes.set(where.userId, next);
          return next;
        }
        const record = {
          id: `code_${referralCodes.size + 1}`,
          userId: where.userId,
          code: create.code,
          active: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        referralCodes.set(where.userId, record);
        return record;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const record = findReferralCodeById(where.id);
        if (!record) {
          throw new Error('referral code not found');
        }
        const updated = {
          ...record,
          usageCount:
            typeof data.usageCount?.increment === 'number'
              ? record.usageCount + data.usageCount.increment
              : record.usageCount,
        };
        referralCodes.set(record.userId, updated);
        return updated;
      }),
    },
    referral: {
      create: vi.fn(async ({ data, include }: any) => {
        const codeRecord = Array.from(referralCodes.values()).find(
          item => item.code === data.code.connect.code
        );
        if (!codeRecord) {
          throw new Error('code not found');
        }
        const id = `ref_${referrals.size + 1}`;
        const record = {
          id,
          codeId: codeRecord.id,
          inviterId: data.inviterId,
          inviteeEmail: data.inviteeEmail ?? null,
          inviteeId: null,
          status: 'sent',
          createdAt: new Date(),
          acceptedAt: null,
          completedAt: null,
          code: codeRecord,
        };
        referrals.set(id, record);
        return include?.code ? record : { ...record, code: undefined };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const record = referrals.get(where.id);
        if (!record) {
          throw new Error('referral not found');
        }
        const updated = {
          ...record,
          ...data,
        };
        referrals.set(where.id, updated);
        return updated;
      }),
      count: vi.fn(async ({ where }: any) => {
        return Array.from(referrals.values()).filter(record => {
          if (where.inviterId && record.inviterId !== where.inviterId) {
            return false;
          }
          if (where.status) {
            if (typeof where.status === 'string' && record.status !== where.status) {
              return false;
            }
            if (Array.isArray(where.status?.in) && !where.status.in.includes(record.status)) {
              return false;
            }
          }
          return true;
        }).length;
      }),
    },
  };

  return {
    __esModule: true,
    prisma,
    default: prisma,
  };
});

import {
  ensureReferralCode,
  getReferralSummary,
  markReferralAccepted,
  markReferralCompleted,
  recordReferralInvite,
} from '@/lib/growth/referrals';

describe('referral growth helpers', () => {
  beforeEach(() => {
    resetStores();
  });

  it('creates and reuses referral codes per user', async () => {
    const code = await ensureReferralCode('user-1');
    expect(code).toMatch(/^[a-f0-9]{10}$/);

    const again = await ensureReferralCode('user-1');
    expect(again).toBe(code);
  });

  it('records invites and tracks status transitions', async () => {
    const code = await ensureReferralCode('user-2');
    expect(code).toBeTruthy();

    const referral = await recordReferralInvite({ inviterId: 'user-2', inviteeEmail: 'friend@example.com' });
    expect(referral.status).toBe('sent');

    const accepted = await markReferralAccepted({ referralId: referral.id, inviteeId: 'friend-1' });
    expect(accepted.status).toBe('accepted');
    expect(accepted.inviteeId).toBe('friend-1');

    const completed = await markReferralCompleted({ referralId: referral.id });
    expect(completed.status).toBe('completed');
  });

  it('summarises referral funnel metrics', async () => {
    await ensureReferralCode('user-3');
    const referral = await recordReferralInvite({ inviterId: 'user-3' });
    await markReferralAccepted({ referralId: referral.id, inviteeId: 'friend-2' });
    await markReferralCompleted({ referralId: referral.id });

    const summary = await getReferralSummary('user-3');
    expect(summary.code).toMatch(/^[a-f0-9]{10}$/);
    expect(summary.sent).toBe(1);
    expect(summary.accepted).toBe(1);
    expect(summary.completed).toBe(1);
  });
});
