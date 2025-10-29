'use server';

// feature: organizer-console
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { MembershipBillingPeriod, SponsorSlotStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  archiveSponsorSlot,
  createMembershipTier,
  createSponsorSlot,
  deleteMembershipTier,
  formatBenefitsInput,
  toPriceCents,
  updateMembershipTier,
  updateSponsorSlot,
  type TierInput
} from '@/lib/groups/organizer-console';

type ActionResult = {
  success: boolean;
  error?: string;
};

async function resolveOrganizerContext(slug: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('UNAUTHENTICATED');
  }

  const group = await prisma.group.findFirst({
    where: { slug },
    select: { id: true }
  });

  if (!group) {
    throw new Error('GROUP_NOT_FOUND');
  }

  return { groupId: group.id, userId: session.user.id };
}

export async function createTierAction(slug: string, formData: FormData): Promise<ActionResult> {
  try {
    const { groupId, userId } = await resolveOrganizerContext(slug);

    const name = String(formData.get('name') ?? '').trim();
    if (!name) {
      return { success: false, error: 'Name is required' };
    }

    const description = String(formData.get('description') ?? '').trim() || null;
    const benefits = formatBenefitsInput(String(formData.get('benefits') ?? ''));
    const billingPeriod = (formData.get('billingPeriod') ?? 'month') as MembershipBillingPeriod;
    const currency = String(formData.get('currency') ?? 'EUR').toUpperCase();
    const isDefault = formData.get('isDefault') === 'on';
    const priceCents = toPriceCents(String(formData.get('price') ?? '0'));

    await createMembershipTier(groupId, userId, {
      name,
      description,
      benefits,
      billingPeriod,
      currency,
      priceCents,
      isDefault
    });

    revalidatePath(`/groups/manage/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create membership tier', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateTierAction(slug: string, formData: FormData): Promise<ActionResult> {
  try {
    const tierId = String(formData.get('tierId') ?? '');
    if (!tierId) {
      return { success: false, error: 'Tier ID missing' };
    }

    const { userId } = await resolveOrganizerContext(slug);

    const updates: Partial<TierInput> = {};

    if (formData.has('isDefault')) {
      updates.isDefault = formData.get('isDefault') === 'true';
    }

    if (formData.has('price')) {
      updates.priceCents = toPriceCents(String(formData.get('price')));
    }

    if (formData.has('benefits')) {
      updates.benefits = formatBenefitsInput(String(formData.get('benefits')));
    }

    if (formData.has('billingPeriod')) {
      updates.billingPeriod = formData.get('billingPeriod') as MembershipBillingPeriod;
    }

    await updateMembershipTier(tierId, userId, updates);

    revalidatePath(`/groups/manage/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update membership tier', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteTierAction(slug: string, formData: FormData): Promise<ActionResult> {
  try {
    const tierId = String(formData.get('tierId') ?? '');
    if (!tierId) {
      return { success: false, error: 'Tier ID missing' };
    }

    const { userId } = await resolveOrganizerContext(slug);
    await deleteMembershipTier(tierId, userId);
    revalidatePath(`/groups/manage/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete membership tier', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createSponsorAction(slug: string, formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get('name') ?? '').trim();
    if (!name) {
      return { success: false, error: 'Sponsor name is required' };
    }

    const { groupId, userId } = await resolveOrganizerContext(slug);

    const status = (formData.get('status') ?? 'draft') as SponsorSlotStatus;
    const impressionGoal = formData.get('impressionGoal');
    const startDateValue = formData.get('startDate');
    const endDateValue = formData.get('endDate');

    await createSponsorSlot(groupId, userId, {
      name,
      description: String(formData.get('description') ?? '').trim() || null,
      assetUrl: String(formData.get('assetUrl') ?? '').trim() || null,
      targetUrl: String(formData.get('targetUrl') ?? '').trim() || null,
      status,
      impressionGoal: impressionGoal ? Number.parseInt(String(impressionGoal), 10) : null,
      startDate: startDateValue ? new Date(String(startDateValue)) : null,
      endDate: endDateValue ? new Date(String(endDateValue)) : null
    });

    revalidatePath(`/groups/manage/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create sponsor slot', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateSponsorStatusAction(slug: string, formData: FormData): Promise<ActionResult> {
  try {
    const slotId = String(formData.get('slotId') ?? '');
    if (!slotId) {
      return { success: false, error: 'Slot ID missing' };
    }

    const status = formData.get('status');
    if (status === 'completed') {
      const { userId } = await resolveOrganizerContext(slug);
      await archiveSponsorSlot(slotId, userId);
    } else {
      const { userId } = await resolveOrganizerContext(slug);
      await updateSponsorSlot(slotId, userId, {
        status: status ? (status as SponsorSlotStatus) : undefined
      });
    }

    revalidatePath(`/groups/manage/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update sponsor slot status', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
