// feature: organizer-console
import { cache } from 'react';
import type {
  GroupMembership,
  GroupMembershipTier,
  MembershipBillingPeriod,
  MembershipStatus,
  SponsorSlotStatus
} from '@prisma/client';

import prisma from '@/lib/prisma';
import { syncTierWithStripe } from '@/lib/payments/stripe';

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
