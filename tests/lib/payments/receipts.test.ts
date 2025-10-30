import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMocks = vi.hoisted(() => ({
  groupMembershipFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  groupFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    groupMembership: { findUnique: prismaMocks.groupMembershipFindUnique },
    user: { findUnique: prismaMocks.userFindUnique },
    group: { findUnique: prismaMocks.groupFindUnique },
  },
}))

const emailMocks = vi.hoisted(() => ({
  sendPaymentReceiptEmail: vi.fn(),
}))

vi.mock('@/lib/email/email-service', () => ({
  sendPaymentReceiptEmail: emailMocks.sendPaymentReceiptEmail,
}))

const { groupMembershipFindUnique, userFindUnique, groupFindUnique } = prismaMocks
const { sendPaymentReceiptEmail } = emailMocks

import { sendMembershipReceiptNotification } from '@/lib/payments/receipts'

describe('sendMembershipReceiptNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
  })

  it('sends a receipt using membership context', async () => {
    const occurredAt = new Date('2024-01-01T12:00:00Z')

    groupMembershipFindUnique.mockResolvedValueOnce({
      id: 'membership-1',
      group: { id: 'group-1', name: 'Downtown Runners', slug: 'downtown-runners' },
      tier: { name: 'Pro', billingPeriod: 'month' },
      user: {
        id: 'user-1',
        email: 'member@example.com',
        name: 'Casey Runner',
        notificationPreferences: { emailNotifications: true },
      },
    })

    await sendMembershipReceiptNotification({
      groupId: 'group-1',
      membershipId: 'membership-1',
      userId: 'user-1',
      amountCents: 2599,
      currency: 'usd',
      occurredAt,
      stripeEventId: 'evt_123',
      invoiceNumber: 'INV-42',
    })

    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1)
    expect(sendPaymentReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        groupName: 'Downtown Runners',
        groupUrl: 'https://app.example.com/groups/downtown-runners',
        membershipTierName: 'Pro',
        billingPeriod: 'month',
        amountCents: 2599,
        currency: 'usd',
        relatedId: 'evt_123',
      }),
    )
    expect(userFindUnique).not.toHaveBeenCalled()
    expect(groupFindUnique).not.toHaveBeenCalled()
  })

  it('does not send when user email is missing', async () => {
    groupMembershipFindUnique.mockResolvedValueOnce({
      id: 'membership-2',
      group: { id: 'group-2', name: 'Yoga Collective', slug: 'yoga-collective' },
      tier: null,
      user: {
        id: 'user-2',
        email: null,
        name: 'Jordan',
        notificationPreferences: { emailNotifications: true },
      },
    })

    await sendMembershipReceiptNotification({
      groupId: 'group-2',
      membershipId: 'membership-2',
      userId: 'user-2',
      amountCents: 1500,
      currency: 'eur',
      occurredAt: new Date(),
      stripeEventId: 'evt_456',
    })

    expect(sendPaymentReceiptEmail).not.toHaveBeenCalled()
  })

  it('falls back to user and group lookups when membership context is absent', async () => {
    const occurredAt = new Date('2024-02-10T08:30:00Z')

    userFindUnique.mockResolvedValueOnce({
      id: 'user-3',
      email: 'fallback@example.com',
      name: 'Morgan',
      notificationPreferences: null,
    })

    groupFindUnique.mockResolvedValueOnce({
      id: 'group-3',
      name: 'Weekend Climbers',
      slug: 'weekend-climbers',
    })

    await sendMembershipReceiptNotification({
      groupId: 'group-3',
      membershipId: null,
      userId: 'user-3',
      amountCents: 4200,
      currency: 'usd',
      occurredAt,
      stripeEventId: 'evt_789',
    })

    expect(groupMembershipFindUnique).not.toHaveBeenCalled()
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1)
    expect(sendPaymentReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        groupName: 'Weekend Climbers',
        groupUrl: 'https://app.example.com/groups/weekend-climbers',
        amountCents: 4200,
      }),
    )
  })
})
