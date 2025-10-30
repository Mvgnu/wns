/**
 * @vitest-environment node
 */

import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import * as NextAuth from 'next-auth'

import { POST } from '@/app/api/payments/stripe/checkout/route'
import prisma from '@/lib/prisma'
import { createMockSession } from '@/lib/test-utils'
import { testDb } from '@/lib/test-utils/database'
import * as StripeModule from '@/lib/payments/stripe'
import * as CouponModule from '@/lib/payments/coupons'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/payments/stripe', () => ({
  getStripeClient: vi.fn(),
  syncTierWithStripe: vi.fn(),
}))

vi.mock('@/lib/payments/coupons', async () => {
  const actual = await vi.importActual<typeof import('@/lib/payments/coupons')>('@/lib/payments/coupons')
  return {
    ...actual,
    syncCouponWithStripe: vi.fn(),
    validateCouponApplicability: vi.fn(),
  }
})

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)
const stripeModule = vi.mocked(StripeModule)
const getStripeClient = stripeModule.getStripeClient
const syncTierWithStripe = stripeModule.syncTierWithStripe
const couponModule = vi.mocked(CouponModule)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Stripe checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    couponModule.validateCouponApplicability.mockResolvedValue({ ok: true })
    couponModule.syncCouponWithStripe.mockResolvedValue({
      couponId: null,
      promotionCodeId: null,
      skipped: true,
    })
  })

  it('requires authentication', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: 'tier_123' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 404 when tier is missing', async () => {
    const user = await testDb.createTestUser()
    getServerSessionMock.mockResolvedValue(createMockSession(user))
    vi.mocked(getStripeClient).mockReturnValue({
      checkout: { sessions: { create: vi.fn() } },
    } as any)

    const request = new NextRequest('http://localhost:3000/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: 'missing' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('returns 503 when Stripe is not configured', async () => {
    const user = await testDb.createTestUser()
    getServerSessionMock.mockResolvedValue(createMockSession(user))
    vi.mocked(getStripeClient).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: 'tier_123' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(503)
  })

  it('creates a checkout session for membership tiers', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id, {
      name: 'Premium',
      priceCents: 2500,
      billingPeriod: 'month',
    })

    getServerSessionMock.mockResolvedValue(createMockSession(user))

    const createSessionMock = vi.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test-session',
    })

    vi.mocked(getStripeClient).mockReturnValue({
      checkout: { sessions: { create: createSessionMock } },
    } as any)

    vi.mocked(syncTierWithStripe).mockResolvedValue({
      productId: 'prod_123',
      priceId: 'price_123',
      skipped: false,
    })

    const request = new NextRequest('http://localhost:3000/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'abc123' },
      body: JSON.stringify({ tierId: tier.id, quantity: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.sessionId).toBe('cs_test_123')
    expect(data.url).toBe('https://checkout.stripe.com/test-session')
    expect(data.mode).toBe('subscription')

    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [expect.objectContaining({ price: 'price_123', quantity: 2 })],
        customer_email: user.email,
      }),
      { idempotencyKey: 'abc123' },
    )
  })

  it('attaches a valid coupon to the checkout session', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id, {
      priceCents: 3000,
      billingPeriod: 'month',
    })
    const coupon = await testDb.createTestCoupon(group.id, {
      code: 'SAVE20',
      discountType: 'percentage',
      percentageOff: 20,
    })

    getServerSessionMock.mockResolvedValue(createMockSession(user))

    const createSessionMock = vi.fn().mockResolvedValue({ id: 'cs_coupon', url: null })

    vi.mocked(getStripeClient).mockReturnValue({
      checkout: { sessions: { create: createSessionMock } },
    } as any)

    vi.mocked(syncTierWithStripe).mockResolvedValue({
      productId: 'prod_coupon',
      priceId: 'price_coupon',
      skipped: false,
    })

    couponModule.syncCouponWithStripe.mockResolvedValue({
      couponId: 'cup_123',
      promotionCodeId: 'promo_123',
      skipped: false,
    })

    const request = new NextRequest('http://localhost:3000/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: tier.id, couponCode: 'save20' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(couponModule.validateCouponApplicability).toHaveBeenCalledWith(coupon.id)
    expect(couponModule.syncCouponWithStripe).toHaveBeenCalledWith(
      expect.objectContaining({ code: coupon.code }),
    )

    const [sessionPayload] = createSessionMock.mock.calls[0]
    expect(sessionPayload.discounts).toEqual([
      { promotion_code: 'promo_123' },
    ])
    expect(sessionPayload.metadata).toMatchObject({
      couponId: coupon.id,
      couponCode: coupon.code,
    })

    const refreshedCoupon = await prisma.groupMembershipCoupon.findUnique({ where: { id: coupon.id } })
    expect(refreshedCoupon?.stripePromotionCodeId).toBe('promo_123')
  })
})
