/**
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/payments/stripe', () => ({
  syncTierWithStripe: vi.fn(),
  getStripeClient: vi.fn()
}))

import {
  requestManualPayout,
  toggleGroupPayoutHold,
  upsertGroupPayoutSchedule
} from '@/lib/groups/organizer-console'
import { testDb } from '@/lib/test-utils/database'
import prisma from '@/lib/prisma'

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Organizer payout orchestration', () => {
  it('upserts payout schedule preferences', async () => {
    const group = await testDb.createTestGroup()

    const schedule = await upsertGroupPayoutSchedule(group.id, group.ownerId, {
      frequency: 'weekly',
      destinationAccount: 'acct_1234'
    })

    expect(schedule.frequency).toBe('weekly')
    expect(schedule.destinationAccount).toBe('acct_1234')
    expect(schedule.status).toBe('active')

    const updated = await upsertGroupPayoutSchedule(group.id, group.ownerId, {
      frequency: 'monthly',
      destinationAccount: '  acct_5678  '
    })

    expect(updated.frequency).toBe('monthly')
    expect(updated.destinationAccount).toBe('acct_5678')
  })

  it('toggles payout holds to pause and resume automation', async () => {
    const group = await testDb.createTestGroup()

    const paused = await toggleGroupPayoutHold(group.id, group.ownerId, true)
    expect(paused.manualHold).toBe(true)
    expect(paused.status).toBe('paused')

    const resumed = await toggleGroupPayoutHold(group.id, group.ownerId, false)
    expect(resumed.manualHold).toBe(false)
    expect(resumed.status).toBe('active')
  })

  it('records manual payout requests with normalized currency', async () => {
    const group = await testDb.createTestGroup()

    const payout = await requestManualPayout(group.id, group.ownerId, {
      amountCents: 12500,
      currency: 'usd',
      note: 'Quarterly bonus draw'
    })

    expect(payout.currency).toBe('USD')
    expect(payout.amountCents).toBe(12500)
    expect(payout.status).toBe('pending')

    const persisted = await prisma.groupPayout.findUnique({ where: { id: payout.id } })
    expect(persisted?.metadata).toMatchObject({ note: 'Quarterly bonus draw' })
  })
})
