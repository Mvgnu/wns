/**
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/payments/stripe', () => ({
  syncTierWithStripe: vi.fn(),
  getStripeClient: vi.fn()
}));

import {
  getOrganizerConsoleData,
  recordDisputeAction
} from '@/lib/groups/organizer-console';
import { testDb } from '@/lib/test-utils/database';
import prisma from '@/lib/prisma';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Organizer dispute workflows', () => {
  it('logs organizer actions and surfaces them in console data', async () => {
    const organizer = await testDb.createTestUser();
    const group = await testDb.createTestGroup({ ownerId: organizer.id, slug: `disputes-${Date.now()}` });

    const dispute = await prisma.groupPaymentDispute.create({
      data: {
        groupId: group.id,
        stripeDisputeId: 'dp_test',
        stripeChargeId: 'ch_test',
        stripeEventId: 'evt_test',
        amountCents: 2500,
        currency: 'EUR',
        status: 'needs_response'
      }
    });

    const action = await recordDisputeAction(dispute.id, organizer.id, {
      actionType: 'note',
      note: 'Contacted attendee and gathered receipts.'
    });

    expect(action.note).toContain('Contacted attendee');

    const refreshedDispute = await prisma.groupPaymentDispute.findUnique({
      where: { id: dispute.id }
    });

    expect(refreshedDispute?.metadata).toMatchObject({
      lastOrganizerActionType: 'note',
      lastOrganizerActionActorId: organizer.id
    });

    const consoleData = await getOrganizerConsoleData(group.slug ?? '', organizer.id);
    expect(consoleData.disputes.length).toBeGreaterThan(0);
    expect(consoleData.disputes[0]?.latestAction?.note).toContain('Contacted attendee');
  });

  it('requires notes for escalations and write-offs', async () => {
    const organizer = await testDb.createTestUser();
    const group = await testDb.createTestGroup({ ownerId: organizer.id, slug: `disputes-${Date.now()}-2` });

    const dispute = await prisma.groupPaymentDispute.create({
      data: {
        groupId: group.id,
        stripeDisputeId: 'dp_test_missing_note',
        stripeChargeId: 'ch_test_missing_note',
        stripeEventId: 'evt_test_missing_note',
        amountCents: 1500,
        currency: 'EUR',
        status: 'needs_response'
      }
    });

    await expect(
      recordDisputeAction(dispute.id, organizer.id, {
        actionType: 'escalated',
        note: ''
      })
    ).rejects.toThrow('NOTE_REQUIRED');
  });
});
