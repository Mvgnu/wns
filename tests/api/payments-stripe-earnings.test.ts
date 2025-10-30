/**
 * @vitest-environment node
 */

import { vi } from 'vitest'
import * as NextAuth from 'next-auth'

import prisma from '@/lib/prisma'
import { testDb } from '@/lib/test-utils/database'
import { GET } from '@/app/api/payments/stripe/earnings/route'
import { createMockRequest, createMockSession } from '../utils'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)
const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Stripe earnings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const response = await GET(createMockRequest('/api/payments/stripe/earnings'))
    expect(response.status).toBe(401)
  })

  it('returns 400 when groupId is missing', async () => {
    const user = await testDb.createTestUser()
    getServerSessionMock.mockResolvedValue(createMockSession(user))

    const response = await GET(createMockRequest('/api/payments/stripe/earnings'))
    expect(response.status).toBe(400)
  })

  it('returns 403 when user is not authorized', async () => {
    const owner = await testDb.createTestUser()
    const requester = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: owner.id })

    getServerSessionMock.mockResolvedValue(createMockSession(requester))

    const response = await GET(
      createMockRequest(`/api/payments/stripe/earnings?groupId=${group.id}`),
    )

    expect(response.status).toBe(403)
  })

  it('returns revenue summary and entries for group owners', async () => {
    const owner = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: owner.id })
    const member = await testDb.createTestUser()

    const membership = await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: member.id,
        status: 'active',
      },
    })

    await prisma.groupRevenueEntry.createMany({
      data: [
        {
          id: 'rev_1',
          groupId: group.id,
          membershipId: membership.id,
          userId: member.id,
          type: 'membership_charge',
          amountGrossCents: 5000,
          amountNetCents: 4500,
          feeCents: 500,
          currency: 'EUR',
          occurredAt: new Date(),
          stripeEventId: 'evt_earnings_1',
          stripeObjectId: 'in_earnings_1',
        },
        {
          id: 'rev_2',
          groupId: group.id,
          membershipId: membership.id,
          userId: member.id,
          type: 'membership_charge',
          amountGrossCents: 2500,
          amountNetCents: 2300,
          feeCents: 200,
          currency: 'EUR',
          occurredAt: new Date(Date.now() - 3600_000),
          stripeEventId: 'evt_earnings_2',
          stripeObjectId: 'in_earnings_2',
        },
      ],
    })

    getServerSessionMock.mockResolvedValue(createMockSession(owner))

    const response = await GET(
      createMockRequest(`/api/payments/stripe/earnings?groupId=${group.id}&limit=1`),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()

    expect(payload.groupId).toBe(group.id)
    expect(payload.summary).toHaveLength(1)
    expect(payload.summary[0]).toMatchObject({
      currency: 'EUR',
      grossCents: 7500,
      netCents: 6800,
      feeCents: 700,
      transactionCount: 2,
    })
    expect(payload.entries).toHaveLength(1)
    expect(payload.entries[0].stripeEventId).toBe('evt_earnings_1')
  })
})
