'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// feature: growth-referrals
// intent: generate referral codes, track invite lifecycle, and expose summary data
//         for onboarding and growth loops without invasive telemetry.

type ReferralInviteInput = {
  inviterId: string;
  inviteeEmail?: string;
};

type ReferralUpdateInput = {
  referralId: string;
  inviteeId?: string;
};

export type ReferralSummary = {
  code: string;
  sent: number;
  accepted: number;
  completed: number;
};

function randomCode() {
  return crypto.randomBytes(5).toString('hex');
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referralCode.findUnique({
    where: { userId },
    select: { code: true, active: true },
  });

  if (existing?.code && existing.active) {
    return existing.code;
  }

  const codeValue = existing?.code ?? randomCode();

  const record = await prisma.referralCode.upsert({
    where: { userId },
    update: {
      code: existing?.code ?? codeValue,
      active: true,
    },
    create: {
      userId,
      code: codeValue,
    },
  });

  return record.code;
}

export async function recordReferralInvite({ inviterId, inviteeEmail }: ReferralInviteInput) {
  const code = await ensureReferralCode(inviterId);

  const referral = await prisma.referral.create({
    data: {
      inviterId,
      inviteeEmail: inviteeEmail ?? null,
      code: {
        connect: { code },
      },
    },
    include: { code: true },
  });

  await prisma.referralCode.update({
    where: { id: referral.code.id },
    data: { usageCount: { increment: 1 } },
  });

  return referral;
}

export async function markReferralAccepted({ referralId, inviteeId }: ReferralUpdateInput) {
  return prisma.referral.update({
    where: { id: referralId },
    data: {
      inviteeId: inviteeId ?? null,
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });
}

export async function markReferralCompleted({ referralId }: ReferralUpdateInput) {
  return prisma.referral.update({
    where: { id: referralId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });
}

export async function getReferralSummary(userId: string): Promise<ReferralSummary> {
  const code = await ensureReferralCode(userId);

  const [sent, accepted, completed] = await Promise.all([
    prisma.referral.count({ where: { inviterId: userId } }),
    prisma.referral.count({
      where: {
        inviterId: userId,
        status: { in: ['accepted', 'completed'] },
      },
    }),
    prisma.referral.count({ where: { inviterId: userId, status: 'completed' } }),
  ]);

  return {
    code,
    sent,
    accepted,
    completed,
  };
}
