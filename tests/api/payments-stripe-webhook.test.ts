/**
 * @vitest-environment node
 */

import { NextRequest } from 'next/server'
import { vi } from 'vitest'

import { POST } from '@/app/api/payments/stripe/webhook/route'
import prisma from '@/lib/prisma'
import { testDb } from '@/lib/test-utils/database'
import * as StripeModule from '@/lib/payments/stripe'

vi.mock('@/lib/payments/stripe', () => ({
  getStripeClient: vi.fn(),
}))

const getStripeClient = vi.mocked(StripeModule.getStripeClient)
const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

function createRequest(body: string, headers?: HeadersInit) {
  return new NextRequest('http://localhost:3000/api/payments/stripe/webhook', {
    method: 'POST',
    headers: new Headers(headers ?? { 'stripe-signature': 'test_signature' }),
    body,
  })
}

describeIfDatabase('Stripe webhook API', () => {
  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 503 when Stripe is not configured', async () => {
    getStripeClient.mockReturnValue(null)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(503)
  })

  it('returns 400 when signature is missing', async () => {
    getStripeClient.mockReturnValue({ webhooks: { constructEvent: vi.fn() } } as any)

    const response = await POST(createRequest('{}', new Headers()))
    expect(response.status).toBe(400)
  })

  it('creates or updates memberships on checkout completion', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id, {
      billingPeriod: 'month',
    })

    const constructEvent = vi.fn().mockReturnValue({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          metadata: {
            userId: user.id,
            tierId: tier.id,
            groupId: group.id,
          },
          subscription: 'sub_123',
          customer: 'cus_123',
          payment_intent: 'pi_123',
          amount_total: 2500,
          currency: 'eur',
          created: Math.floor(Date.now() / 1000),
        },
      },
    })

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    expect(membership).not.toBeNull()
    expect(membership?.status).toBe('active')
    expect(membership?.stripeSubscriptionId).toBe('sub_123')
    expect(membership?.stripeCustomerId).toBe('cus_123')
    expect(membership?.stripeLastEventId).toBe('evt_checkout')
    expect(constructEvent).toHaveBeenCalledWith('{}', 'test_signature', 'whsec_test')

    const legacyStatus = await prisma.groupMemberStatus.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    expect(legacyStatus?.status).toBe('active')

    const revenueEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_checkout' },
    })

    expect(revenueEntry).not.toBeNull()
    expect(revenueEntry?.amountGrossCents).toBe(2500)
    expect(revenueEntry?.currency).toBe('EUR')
    expect(revenueEntry?.groupId).toBe(group.id)
  })

  it('records coupon usage on checkout completion', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id)
    const coupon = await testDb.createTestCoupon(group.id, {
      code: 'WELCOME',
      stripePromotionCodeId: 'promo_coupon',
    })

    const constructEvent = vi.fn().mockReturnValue({
      id: 'evt_coupon_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_coupon_checkout',
          metadata: {
            userId: user.id,
            tierId: tier.id,
            groupId: group.id,
            couponId: coupon.id,
            couponCode: coupon.code,
          },
          subscription: null,
          customer: 'cus_coupon',
          payment_intent: 'pi_coupon',
          amount_total: 1800,
          currency: 'eur',
          created: Math.floor(Date.now() / 1000),
          total_details: {
            breakdown: {
              discounts: [{ promotion_code: 'promo_coupon' }],
            },
          },
        },
      },
    })

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const revenueEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_coupon_checkout' },
    })

    expect(revenueEntry?.couponId).toBe(coupon.id)
    const refreshedCoupon = await prisma.groupMembershipCoupon.findUnique({ where: { id: coupon.id } })
    expect(refreshedCoupon?.redemptionCount).toBe(1)
  })

  it('skips revenue entry when checkout session is subscription mode', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id)

    const constructEvent = vi.fn().mockReturnValue({
      id: 'evt_checkout_subscription',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_subscription',
          metadata: {
            userId: user.id,
            tierId: tier.id,
            groupId: group.id,
          },
          subscription: 'sub_subscription',
          customer: 'cus_subscription',
          payment_intent: 'pi_subscription',
          amount_total: 3500,
          currency: 'eur',
          created: Math.floor(Date.now() / 1000),
          mode: 'subscription',
        },
      },
    })

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const revenueEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_checkout_subscription' },
    })

    expect(revenueEntry).toBeNull()
  })

  it('records revenue from subscription invoices without duplicating checkout entries', async () => {
    const owner = await testDb.createTestUser()
    const member = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: owner.id })
    const tier = await testDb.createTestMembershipTier(group.id)

    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: member.id,
        tierId: tier.id,
        status: 'active',
        stripeSubscriptionId: 'sub_invoice',
        stripeCustomerId: 'cus_invoice',
      },
    })

    const invoiceEvent = {
      id: 'evt_invoice_paid',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_paid',
          subscription: 'sub_invoice',
          customer: 'cus_invoice',
          payment_intent: 'pi_paid',
          amount_paid: 5500,
          total: 5500,
          currency: 'eur',
          created: Math.floor(Date.now() / 1000),
          status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
          lines: {
            data: [
              {
                period: {
                  end: Math.floor(Date.now() / 1000) + 3600,
                },
              },
            ],
          },
        },
      },
    }

    const constructEvent = vi.fn().mockReturnValue(invoiceEvent as any)

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const revenueEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_invoice_paid' },
    })

    expect(revenueEntry).not.toBeNull()
    expect(revenueEntry?.amountGrossCents).toBe(5500)
    expect(revenueEntry?.amountNetCents).toBe(5500)
    expect(revenueEntry?.currency).toBe('EUR')
    expect(revenueEntry?.membershipId).not.toBeNull()
  })

  it('marks memberships as past due when invoice payment fails', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const tier = await testDb.createTestMembershipTier(group.id)

    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        tierId: tier.id,
        status: 'active',
        stripeSubscriptionId: 'sub_fail',
        stripeCustomerId: 'cus_existing',
      },
    })

    const constructEvent = vi.fn().mockReturnValue({
      id: 'evt_invoice_failed',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_test',
          subscription: 'sub_fail',
          customer: 'cus_existing',
          payment_intent: 'pi_failed',
          created: Math.floor(Date.now() / 1000),
          status_transitions: {},
          lines: {
            data: [
              {
                period: {
                  end: Math.floor(Date.now() / 1000) + 3600,
                },
              },
            ],
          },
        },
      },
    })

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    expect(membership?.status).toBe('past_due')
    expect(membership?.stripePaymentIntentId).toBe('pi_failed')
    expect(membership?.stripeLastEventId).toBe('evt_invoice_failed')

    const legacyStatus = await prisma.groupMemberStatus.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    })

    expect(legacyStatus?.status).toBe('inactive')
  })

  it('records refunds in audit tables and revenue ledger', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const membership = await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        status: 'active',
        startedAt: new Date(),
        renewedAt: new Date(),
        stripeCustomerId: 'cus_refund',
        stripePaymentIntentId: 'pi_refund',
      },
    })

    await prisma.groupRevenueEntry.create({
      data: {
        groupId: group.id,
        membershipId: membership.id,
        userId: user.id,
        type: 'membership_charge',
        amountGrossCents: 2500,
        amountNetCents: 2400,
        currency: 'EUR',
        occurredAt: new Date(),
        stripeEventId: 'evt_initial_charge',
        stripeObjectId: 'ch_refund',
        stripeBalanceTransaction: 'ch_refund',
      },
    })

    const timestamp = Math.floor(Date.now() / 1000)
    const constructEvent = vi.fn().mockReturnValue({
      id: 'evt_refund',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_refund',
          amount_refunded: 1500,
          balance_transaction: 'txn_refund',
          payment_intent: 'pi_refund',
          customer: 'cus_refund',
          currency: 'eur',
          created: timestamp,
          refunds: {
            data: [
              {
                id: 're_1',
                amount: 1500,
                currency: 'eur',
                status: 'succeeded',
                reason: 'requested_by_customer',
                failure_reason: null,
                created: timestamp,
                balance_transaction: 'txn_refund',
              },
            ],
          },
        },
      },
    })

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const response = await POST(createRequest('{}'))
    expect(response.status).toBe(200)

    const refundRecord = await prisma.groupPaymentRefund.findUnique({
      where: { stripeRefundId: 're_1' },
    })

    expect(refundRecord).not.toBeNull()
    expect(refundRecord?.groupId).toBe(group.id)
    expect(refundRecord?.status).toBe('succeeded')
    expect(refundRecord?.amountCents).toBe(1500)

    const refundLedgerEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_refund' },
    })

    expect(refundLedgerEntry).not.toBeNull()
    expect(refundLedgerEntry?.type).toBe('membership_refund')
    expect(refundLedgerEntry?.amountGrossCents).toBe(-1500)
  })

  it('tracks disputes and chargebacks with audit entries', async () => {
    const user = await testDb.createTestUser()
    const group = await testDb.createTestGroup({ ownerId: user.id })
    const membership = await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        status: 'active',
        startedAt: new Date(),
        renewedAt: new Date(),
        stripeCustomerId: 'cus_dispute',
        stripePaymentIntentId: 'pi_dispute',
      },
    })

    await prisma.groupRevenueEntry.create({
      data: {
        groupId: group.id,
        membershipId: membership.id,
        userId: user.id,
        type: 'membership_charge',
        amountGrossCents: 3200,
        amountNetCents: 3000,
        currency: 'EUR',
        occurredAt: new Date(),
        stripeEventId: 'evt_charge_for_dispute',
        stripeObjectId: 'ch_dispute',
        stripeBalanceTransaction: 'ch_dispute',
      },
    })

    const now = Math.floor(Date.now() / 1000)
    const constructEvent = vi
      .fn()
      .mockImplementationOnce(() => ({
        id: 'evt_dispute_created',
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_1',
            charge: 'ch_dispute',
            amount: 2000,
            currency: 'eur',
            status: 'needs_response',
            reason: 'fraudulent',
            payment_intent: 'pi_dispute',
            customer: 'cus_dispute',
            evidence_details: { due_by: now + 3600 },
          },
        },
      }))
      .mockImplementationOnce(() => ({
        id: 'evt_dispute_closed',
        type: 'charge.dispute.closed',
        data: {
          object: {
            id: 'dp_1',
            charge: 'ch_dispute',
            amount: 2000,
            currency: 'eur',
            status: 'lost',
            reason: 'fraudulent',
            payment_intent: 'pi_dispute',
            customer: 'cus_dispute',
            closed_at: now + 7200,
            balance_transactions: [{ id: 'txn_chargeback' }],
            evidence_details: { due_by: now + 3600 },
          },
        },
      }))

    getStripeClient.mockReturnValue({
      webhooks: { constructEvent },
    } as any)

    const createdResponse = await POST(createRequest('{}'))
    expect(createdResponse.status).toBe(200)

    const closedResponse = await POST(createRequest('{}'))
    expect(closedResponse.status).toBe(200)

    const disputeRecord = await prisma.groupPaymentDispute.findUnique({
      where: { stripeDisputeId: 'dp_1' },
    })

    expect(disputeRecord).not.toBeNull()
    expect(disputeRecord?.status).toBe('lost')
    expect(disputeRecord?.closedAt).not.toBeNull()

    const chargebackEntry = await prisma.groupRevenueEntry.findUnique({
      where: { stripeEventId: 'evt_dispute_closed' },
    })

    expect(chargebackEntry).not.toBeNull()
    expect(chargebackEntry?.type).toBe('membership_chargeback')
    expect(chargebackEntry?.amountGrossCents).toBe(-2000)
  })
})
