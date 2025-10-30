// feature: organizer-console
import { cache } from 'react';
import type {
  GroupMembership,
  GroupMembershipCoupon,
  GroupMembershipTier,
  GroupPayout,
  GroupPayoutSchedule,
  MembershipBillingPeriod,
  MembershipDiscountType,
  MembershipStatus,
  PayoutFrequency,
  PayoutScheduleStatus,
  PayoutStatus,
  SponsorSlotStatus
} from '@prisma/client';

import prisma from '@/lib/prisma';
import { syncTierWithStripe } from '@/lib/payments/stripe';
import {
  deactivateStripePromotion,
  normalizeCouponCode,
  syncCouponWithStripe,
  validateCouponAmount
} from '@/lib/payments/coupons';
import {
  getGroupRevenueSummary,
  listRevenueEntries
} from '@/lib/payments/revenue';

type OrganizerConsoleData = {
  group: {
    id: string;
    name: string;
    slug: string | null;
    memberCount: number;
    location?: string | null;
  };
  membership: {
    total: number;
    active: number;
    paying: number;
    churned: number;
    monthlyRecurringRevenue: number;
  };
  tiers: Array<{
    id: string;
    name: string;
    description?: string | null;
    benefits: string[];
    priceCents: number;
    currency: string;
    billingPeriod: MembershipBillingPeriod;
    isDefault: boolean;
    memberCount: number;
  }>;
  coupons: Array<{
    id: string;
    code: string;
    description?: string | null;
    discountType: MembershipDiscountType;
    percentageOff?: number | null;
    amountOffCents?: number | null;
    currency?: string | null;
    maxRedemptions?: number | null;
    redemptionCount: number;
    isActive: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }>;
  revenue: {
    summary: Array<{
      currency: string;
      grossCents: number;
      netCents: number;
      feeCents: number;
      transactionCount: number;
    }>;
    recentEntries: Array<{
      id: string;
      type: string;
      amountGrossCents: number;
      amountNetCents: number;
      feeCents: number;
      currency: string;
      occurredAt: Date;
      metadata?: Record<string, unknown> | null;
    }>;
  };
  payouts: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: PayoutStatus;
    initiatedAt: Date;
    completedAt?: Date | null;
    failureReason?: string | null;
  }>;
  payoutSchedule?: {
    id: string;
    frequency: PayoutFrequency;
    status: PayoutScheduleStatus;
    destinationAccount?: string | null;
    manualHold: boolean;
    lastPayoutAt?: Date | null;
    nextPayoutScheduledAt?: Date | null;
  };
  sponsors: Array<{
    id: string;
    name: string;
    status: SponsorSlotStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    impressionGoal?: number | null;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startTime: Date;
    isSoldOut: boolean;
    maxAttendees?: number | null;
  }>;
};

type OrganizerAuthorization = {
  groupId: string;
  isOrganizer: boolean;
};

const organizerAccessCache = cache(async (groupId: string, userId: string): Promise<OrganizerAuthorization> => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      ownerId: true,
      admins: {
        select: { userId: true }
      }
    }
  });

  if (!group) {
    return { groupId, isOrganizer: false };
  }

  const isOrganizer = group.ownerId === userId || group.admins.some((admin) => admin.userId === userId);

  return { groupId, isOrganizer };
});

async function assertOrganizerAccess(groupId: string, userId: string) {
  const { isOrganizer } = await organizerAccessCache(groupId, userId);

  if (!isOrganizer) {
    throw new Error('UNAUTHORIZED');
  }
}

export const getOrganizerConsoleData = cache(async (slug: string, userId: string): Promise<OrganizerConsoleData> => {
  const group = await prisma.group.findFirst({
    where: { slug },
    include: {
      admins: { select: { userId: true } },
      membershipTiers: {
        orderBy: { createdAt: 'asc' }
      },
      memberships: {
        include: {
          tier: { select: { id: true, billingPeriod: true, priceCents: true } }
        }
      },
      sponsorSlots: {
        orderBy: { createdAt: 'desc' }
      },
      events: {
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startTime: true,
          isSoldOut: true,
          maxAttendees: true
        }
      }
    }
  });

  if (!group) {
    throw new Error('GROUP_NOT_FOUND');
  }

  const { isOrganizer } = await organizerAccessCache(group.id, userId);

  if (!isOrganizer) {
    throw new Error('UNAUTHORIZED');
  }

  const totalMemberships = group.memberships.length;
  const activeMemberships = group.memberships.filter((membership) => membership.status === 'active').length;
  const churnedMemberships = group.memberships.filter((membership) => membership.status === 'canceled').length;
  const payingMemberships = group.memberships.filter((membership) => Boolean(membership.tierId)).length;

  const tierMemberCounts = new Map<string, number>();
  group.memberships.forEach((membership) => {
    if (membership.tierId) {
      tierMemberCounts.set(membership.tierId, (tierMemberCounts.get(membership.tierId) ?? 0) + 1);
    }
  });

  const monthlyRecurringRevenue = group.memberships.reduce((acc, membership) => {
    if (!membership.tier) return acc;
    if (membership.tier.billingPeriod === 'month') {
      return acc + membership.tier.priceCents;
    }

    if (membership.tier.billingPeriod === 'year') {
      return acc + Math.round(membership.tier.priceCents / 12);
    }

    return acc;
  }, 0);

  const [couponRows, revenueSummary, recentRevenueEntries, payoutSchedule, payoutRows] = await Promise.all([
    prisma.groupMembershipCoupon.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: 'desc' }
    }),
    getGroupRevenueSummary(group.id),
    listRevenueEntries({ groupId: group.id, limit: 25 }),
    prisma.groupPayoutSchedule.findUnique({ where: { groupId: group.id } }),
    prisma.groupPayout.findMany({
      where: { groupId: group.id },
      orderBy: { initiatedAt: 'desc' },
      take: 15
    })
  ]);

  return {
    group: {
      id: group.id,
      name: group.name,
      slug: group.slug,
      memberCount: group.memberCount ?? group.memberships.length,
      location: group.location ?? group.locationName
    },
    membership: {
      total: totalMemberships,
      active: activeMemberships,
      paying: payingMemberships,
      churned: churnedMemberships,
      monthlyRecurringRevenue
    },
    tiers: group.membershipTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      benefits: tier.benefits,
      priceCents: tier.priceCents,
      currency: tier.currency,
      billingPeriod: tier.billingPeriod,
      isDefault: tier.isDefault,
      memberCount: tierMemberCounts.get(tier.id) ?? 0
    })),
    coupons: couponRows.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      percentageOff: coupon.percentageOff,
      amountOffCents: coupon.amountOffCents,
      currency: coupon.currency,
      maxRedemptions: coupon.maxRedemptions,
      redemptionCount: coupon.redemptionCount,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt
    })),
    revenue: {
      summary: revenueSummary,
      recentEntries: recentRevenueEntries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        amountGrossCents: entry.amountGrossCents,
        amountNetCents: entry.amountNetCents,
        feeCents: entry.feeCents,
        currency: entry.currency,
        occurredAt: entry.occurredAt,
        metadata: entry.metadata as Record<string, unknown> | null
      }))
    },
    payouts: payoutRows.map((payout) => ({
      id: payout.id,
      amountCents: payout.amountCents,
      currency: payout.currency,
      status: payout.status,
      initiatedAt: payout.initiatedAt,
      completedAt: payout.completedAt,
      failureReason: payout.failureReason
    })),
    payoutSchedule: payoutSchedule
      ? {
          id: payoutSchedule.id,
          frequency: payoutSchedule.frequency,
          status: payoutSchedule.status,
          destinationAccount: payoutSchedule.destinationAccount,
          manualHold: payoutSchedule.manualHold,
          lastPayoutAt: payoutSchedule.lastPayoutAt,
          nextPayoutScheduledAt: payoutSchedule.nextPayoutScheduledAt
        }
      : undefined,
    sponsors: group.sponsorSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      status: slot.status,
      startDate: slot.startDate,
      endDate: slot.endDate,
      impressionGoal: slot.impressionGoal
    })),
    upcomingEvents: group.events
  };
});

export type TierInput = {
  name: string;
  description?: string | null;
  benefits: string[];
  priceCents: number;
  currency: string;
  billingPeriod: MembershipBillingPeriod;
  isDefault: boolean;
};

export async function createMembershipTier(groupId: string, userId: string, input: TierInput) {
  await assertOrganizerAccess(groupId, userId);

  const tier = await prisma.$transaction(async (tx) => {
    const created = await tx.groupMembershipTier.create({
      data: {
        groupId,
        name: input.name,
        description: input.description,
        benefits: input.benefits,
        priceCents: input.priceCents,
        currency: input.currency,
        billingPeriod: input.billingPeriod,
        isDefault: input.isDefault
      }
    });

    if (input.isDefault) {
      await tx.groupMembershipTier.updateMany({
        where: {
          groupId,
          id: { not: created.id }
        },
        data: { isDefault: false }
      });
    }

    return created;
  });

  const syncResult = await syncTierWithStripe({
    id: tier.id,
    name: tier.name,
    description: tier.description,
    currency: tier.currency,
    priceCents: tier.priceCents,
    billingPeriod: tier.billingPeriod,
    stripeProductId: tier.stripeProductId,
    stripePriceId: tier.stripePriceId
  });

  if (!syncResult.skipped) {
    return prisma.groupMembershipTier.update({
      where: { id: tier.id },
      data: {
        stripeProductId: syncResult.productId,
        stripePriceId: syncResult.priceId
      }
    });
  }

  return tier;
}

export async function updateMembershipTier(
  tierId: string,
  userId: string,
  updates: Partial<TierInput>
) {
  const tier = await prisma.groupMembershipTier.findUnique({
    where: { id: tierId },
    select: { id: true, groupId: true }
  });

  if (!tier) {
    throw new Error('TIER_NOT_FOUND');
  }

  await assertOrganizerAccess(tier.groupId, userId);

  const updatedTier = await prisma.$transaction(async (tx) => {
    const nextTier = await tx.groupMembershipTier.update({
      where: { id: tierId },
      data: updates
    });

    if (updates.isDefault) {
      await tx.groupMembershipTier.updateMany({
        where: {
          groupId: tier.groupId,
          id: { not: tierId }
        },
        data: { isDefault: false }
      });
    }

    return nextTier;
  });

  const syncResult = await syncTierWithStripe({
    id: updatedTier.id,
    name: updatedTier.name,
    description: updatedTier.description,
    currency: updatedTier.currency,
    priceCents: updatedTier.priceCents,
    billingPeriod: updatedTier.billingPeriod,
    stripeProductId: updatedTier.stripeProductId,
    stripePriceId: updatedTier.stripePriceId
  });

  if (!syncResult.skipped) {
    return prisma.groupMembershipTier.update({
      where: { id: updatedTier.id },
      data: {
        stripeProductId: syncResult.productId,
        stripePriceId: syncResult.priceId
      }
    });
  }

  return updatedTier;
}

export async function deleteMembershipTier(tierId: string, userId: string) {
  const tier = await prisma.groupMembershipTier.findUnique({
    where: { id: tierId },
    select: {
      id: true,
      groupId: true,
      isDefault: true,
      memberships: { select: { id: true }, take: 1 }
    }
  });

  if (!tier) {
    throw new Error('TIER_NOT_FOUND');
  }

  await assertOrganizerAccess(tier.groupId, userId);

  if (tier.isDefault) {
    throw new Error('CANNOT_DELETE_DEFAULT_TIER');
  }

  if (tier.memberships.length > 0) {
    throw new Error('TIER_HAS_MEMBERS');
  }

  await prisma.groupMembershipTier.delete({ where: { id: tierId } });
}

export type CouponInput = {
  code: string;
  description?: string | null;
  discountType: MembershipDiscountType;
  percentageOff?: number | null;
  amountOffCents?: number | null;
  currency?: string | null;
  maxRedemptions?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

function sanitizeCouponInput(groupCurrency: string, input: CouponInput) {
  const normalizedCode = normalizeCouponCode(input.code);
  if (!normalizedCode) {
    throw new Error('COUPON_CODE_REQUIRED');
  }

  const validation = validateCouponAmount(
    input.discountType,
    input.percentageOff ?? null,
    input.amountOffCents ?? null
  );

  if (!validation.ok) {
    throw new Error(validation.reason ?? 'COUPON_INVALID');
  }

  if (input.maxRedemptions != null && input.maxRedemptions < 0) {
    throw new Error('COUPON_MAX_INVALID');
  }

  if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
    throw new Error('COUPON_RANGE_INVALID');
  }

  const resolvedCurrency =
    input.discountType === 'fixed_amount'
      ? (input.currency ?? groupCurrency).toUpperCase()
      : null;

  return {
    code: normalizedCode,
    description: input.description ?? null,
    discountType: input.discountType,
    percentageOff:
      input.discountType === 'percentage' && input.percentageOff != null
        ? Math.round(input.percentageOff)
        : null,
    amountOffCents:
      input.discountType === 'fixed_amount' && input.amountOffCents != null
        ? Math.round(input.amountOffCents)
        : null,
    currency: resolvedCurrency,
    maxRedemptions: input.maxRedemptions ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null
  };
}

export async function createMembershipCoupon(groupId: string, userId: string, input: CouponInput) {
  await assertOrganizerAccess(groupId, userId);

  const sanitized = sanitizeCouponInput('EUR', input);

  const coupon = await prisma.groupMembershipCoupon.create({
    data: {
      groupId,
      code: sanitized.code,
      description: sanitized.description,
      discountType: sanitized.discountType,
      percentageOff: sanitized.percentageOff,
      amountOffCents: sanitized.amountOffCents,
      currency: sanitized.currency,
      maxRedemptions: sanitized.maxRedemptions,
      startsAt: sanitized.startsAt,
      endsAt: sanitized.endsAt
    }
  });

  const syncResult = await syncCouponWithStripe({
    code: coupon.code,
    discountType: coupon.discountType,
    percentageOff: coupon.percentageOff ?? undefined,
    amountOffCents: coupon.amountOffCents ?? undefined,
    currency: coupon.currency ?? undefined,
    maxRedemptions: coupon.maxRedemptions ?? undefined,
    startsAt: coupon.startsAt ?? undefined,
    endsAt: coupon.endsAt ?? undefined,
    stripeCouponId: coupon.stripeCouponId,
    stripePromotionCodeId: coupon.stripePromotionCodeId
  });

  if (!syncResult.skipped) {
    return prisma.groupMembershipCoupon.update({
      where: { id: coupon.id },
      data: {
        stripeCouponId: syncResult.couponId,
        stripePromotionCodeId: syncResult.promotionCodeId
      }
    });
  }

  return coupon;
}

export async function deactivateMembershipCoupon(couponId: string, userId: string) {
  const coupon = await prisma.groupMembershipCoupon.findUnique({
    where: { id: couponId },
    select: { groupId: true, isActive: true, stripePromotionCodeId: true, endsAt: true }
  });

  if (!coupon) {
    throw new Error('COUPON_NOT_FOUND');
  }

  await assertOrganizerAccess(coupon.groupId, userId);

  if (!coupon.isActive) {
    return prisma.groupMembershipCoupon.update({
      where: { id: couponId },
      data: { isActive: false }
    });
  }

  const updated = await prisma.groupMembershipCoupon.update({
    where: { id: couponId },
    data: {
      isActive: false,
      endsAt: coupon.endsAt ?? new Date()
    }
  });

  await deactivateStripePromotion(coupon.stripePromotionCodeId);

  return updated;
}

export async function listMembershipCoupons(groupId: string, userId: string) {
  await assertOrganizerAccess(groupId, userId);

  return prisma.groupMembershipCoupon.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' }
  });
}

export type PayoutScheduleInput = {
  frequency: PayoutFrequency;
  destinationAccount?: string | null;
};

export async function upsertGroupPayoutSchedule(
  groupId: string,
  userId: string,
  input: PayoutScheduleInput
): Promise<GroupPayoutSchedule> {
  await assertOrganizerAccess(groupId, userId);

  const sanitizedDestination = input.destinationAccount?.trim() || null;

  return prisma.groupPayoutSchedule.upsert({
    where: { groupId },
    create: {
      groupId,
      frequency: input.frequency,
      destinationAccount: sanitizedDestination,
      status: sanitizedDestination ? 'active' : 'paused'
    },
    update: {
      frequency: input.frequency,
      destinationAccount: sanitizedDestination,
      status: sanitizedDestination ? 'active' : undefined
    }
  });
}

export async function toggleGroupPayoutHold(
  groupId: string,
  userId: string,
  hold: boolean
): Promise<GroupPayoutSchedule> {
  await assertOrganizerAccess(groupId, userId);

  const schedule = await prisma.groupPayoutSchedule.findUnique({ where: { groupId } });

  if (!schedule) {
    return prisma.groupPayoutSchedule.create({
      data: {
        groupId,
        frequency: 'manual',
        status: hold ? 'paused' : 'active',
        manualHold: hold
      }
    });
  }

  return prisma.groupPayoutSchedule.update({
    where: { id: schedule.id },
    data: {
      manualHold: hold,
      status: hold ? 'paused' : schedule.status === 'paused' ? 'active' : schedule.status
    }
  });
}

export type ManualPayoutInput = {
  amountCents: number;
  currency: string;
  note?: string | null;
};

export async function requestManualPayout(
  groupId: string,
  userId: string,
  input: ManualPayoutInput
): Promise<GroupPayout> {
  await assertOrganizerAccess(groupId, userId);

  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error('INVALID_PAYOUT_AMOUNT');
  }

  const schedule = await prisma.groupPayoutSchedule.upsert({
    where: { groupId },
    create: {
      groupId,
      frequency: 'manual',
      status: 'active',
      manualHold: false
    },
    update: {}
  });

  const payout = await prisma.groupPayout.create({
    data: {
      groupId,
      scheduleId: schedule.id,
      amountCents: Math.round(input.amountCents),
      currency: input.currency.toUpperCase(),
      status: schedule.manualHold ? 'pending' : 'pending',
      metadata: input.note ? { note: input.note } : undefined
    }
  });

  await prisma.groupPayoutSchedule.update({
    where: { id: schedule.id },
    data: {
      manualHold: schedule.manualHold,
      status: schedule.manualHold ? 'paused' : schedule.status,
      nextPayoutScheduledAt: null
    }
  });

  return payout;
}

type SponsorInput = {
  name: string;
  description?: string | null;
  assetUrl?: string | null;
  targetUrl?: string | null;
  impressionGoal?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: SponsorSlotStatus;
};

export async function createSponsorSlot(groupId: string, userId: string, input: SponsorInput) {
  await assertOrganizerAccess(groupId, userId);

  return prisma.groupSponsorSlot.create({
    data: {
      groupId,
      name: input.name,
      description: input.description,
      assetUrl: input.assetUrl,
      targetUrl: input.targetUrl,
      impressionGoal: input.impressionGoal ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: input.status ?? 'draft'
    }
  });
}

export async function updateSponsorSlot(
  slotId: string,
  userId: string,
  updates: Partial<SponsorInput>
) {
  const slot = await prisma.groupSponsorSlot.findUnique({
    where: { id: slotId },
    select: { id: true, groupId: true }
  });

  if (!slot) {
    throw new Error('SPONSOR_SLOT_NOT_FOUND');
  }

  await assertOrganizerAccess(slot.groupId, userId);

  return prisma.groupSponsorSlot.update({
    where: { id: slotId },
    data: updates
  });
}

export async function archiveSponsorSlot(slotId: string, userId: string) {
  await updateSponsorSlot(slotId, userId, { status: 'completed' });
}

export function formatBenefitsInput(rawBenefits: string | string[]): string[] {
  if (Array.isArray(rawBenefits)) {
    return rawBenefits
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return rawBenefits
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toPriceCents(amount: string): number {
  const parsed = Number.parseFloat(amount);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function summarizeMembershipStatus(memberships: GroupMembership[]): Record<MembershipStatus, number> {
  return memberships.reduce<Record<MembershipStatus, number>>((acc, membership) => {
    acc[membership.status] = (acc[membership.status] ?? 0) + 1;
    return acc;
  }, {} as Record<MembershipStatus, number>);
}

export function totalRecurringValue(tiers: GroupMembershipTier[], memberships: GroupMembership[]): number {
  const tierMap = new Map<string, GroupMembershipTier>();
  tiers.forEach((tier) => tierMap.set(tier.id, tier));

  return memberships.reduce((acc, membership) => {
    if (!membership.tierId) return acc;
    const tier = tierMap.get(membership.tierId);
    if (!tier) return acc;

    if (tier.billingPeriod === 'month') {
      return acc + tier.priceCents;
    }

    if (tier.billingPeriod === 'year') {
      return acc + Math.round(tier.priceCents / 12);
    }

    return acc;
  }, 0);
}
