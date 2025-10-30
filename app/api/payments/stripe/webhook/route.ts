// feature: commerce-checkout
import type Stripe from 'stripe'
import { NextResponse, type NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { getStripeClient } from '@/lib/payments/stripe'
import { findCouponByStripePromotionCode, recordCouponRedemption } from '@/lib/payments/coupons'
import { upsertPaymentDispute, upsertPaymentRefund } from '@/lib/payments/audit'
import { sendMembershipReceiptNotification } from '@/lib/payments/receipts'
import { upsertRevenueEntry } from '@/lib/payments/revenue'
import {
  MembershipStatus as PrismaMembershipStatus,
  PaymentDisputeStatus,
  PaymentRefundStatus,
  PayoutStatus,
  RevenueEntryType,
} from '@prisma/client'

const logPrefix = '[payments] stripe webhook'

function asStripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
    return value.id
  }

  return null
}

function unixToDate(timestamp: number | null | undefined): Date | null {
  if (typeof timestamp !== 'number') {
    return null
  }

  return new Date(timestamp * 1000)
}

function calculateExpiration(baseDate: Date, period: string | null | undefined): Date | null {
  if (!period) {
    return null
  }

  if (period === 'month') {
    const result = new Date(baseDate)
    result.setMonth(result.getMonth() + 1)
    return result
  }

  if (period === 'year') {
    const result = new Date(baseDate)
    result.setFullYear(result.getFullYear() + 1)
    return result
  }

  return null
}

// sync_target: groupMemberStatus
function mapLegacyMemberStatus(status: PrismaMembershipStatus): 'active' | 'inactive' {
  if (status === 'active') {
    return 'active'
  }

  return 'inactive'
}

type LegacyStatusParams = {
  groupId: string
  userId: string
  status: PrismaMembershipStatus
  joinedAt?: Date | null
}

async function syncGroupMemberStatus({ groupId, userId, status, joinedAt }: LegacyStatusParams) {
  const legacyStatus = mapLegacyMemberStatus(status)
  const now = new Date()

  await prisma.groupMemberStatus.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: {
      groupId,
      userId,
      status: legacyStatus,
      joinedAt: joinedAt ?? now,
      ...(legacyStatus === 'active' ? { lastActive: now } : {}),
    },
    update: {
      status: legacyStatus,
      ...(legacyStatus === 'active' ? { lastActive: now } : {}),
    },
  })
}

function mapRefundStatus(status: Stripe.Refund.Status | null | undefined): PaymentRefundStatus {
  if (status === 'succeeded') {
    return 'succeeded'
  }

  if (status === 'failed') {
    return 'failed'
  }

  if (status === 'canceled') {
    return 'canceled'
  }

  return 'pending'
}

function mapDisputeStatus(status: Stripe.Dispute.Status | null | undefined): PaymentDisputeStatus {
  switch (status) {
    case 'needs_response':
      return 'needs_response'
    case 'warning_needs_response':
      return 'warning_needs_response'
    case 'warning_under_review':
      return 'warning_under_review'
    case 'under_review':
      return 'under_review'
    case 'warning_closed':
      return 'warning_closed'
    case 'charge_refunded':
      return 'charge_refunded'
    case 'won':
      return 'won'
    case 'lost':
      return 'lost'
    default:
      return 'under_review'
  }
}

function mapPayoutStatus(status: Stripe.Payout.Status | null | undefined): PayoutStatus {
  switch (status) {
    case 'paid':
      return 'paid'
    case 'in_transit':
      return 'in_transit'
    case 'canceled':
      return 'canceled'
    case 'failed':
      return 'failed'
    case 'pending':
    default:
      return 'pending'
  }
}

function readMetadataString(metadata: Stripe.Metadata | null | undefined, key: string): string | null {
  if (!metadata) {
    return null
  }

  const value = metadata[key]

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function mergePayoutMetadata(existing: unknown, payout: Stripe.Payout) {
  const base = (typeof existing === 'object' && existing !== null ? existing : {}) as Record<string, unknown>
  const arrivalDate = unixToDate(payout.arrival_date)?.toISOString() ?? null
  const existingStripe =
    typeof base.stripe === 'object' && base.stripe !== null ? (base.stripe as Record<string, unknown>) : {}

  return {
    ...base,
    stripe: {
      ...existingStripe,
      payoutType: payout.type ?? null,
      destinationType: payout.destination_type ?? null,
      destination: payout.destination ?? null,
      arrivalDate,
      balanceTransaction: payout.balance_transaction ?? null,
      failureCode: payout.failure_code ?? null,
      failureMessage: payout.failure_message ?? null,
      statementDescriptor: payout.statement_descriptor ?? null,
      metadata: payout.metadata ?? {},
    },
  }
}

async function updateScheduleAfterPayout(scheduleId: string | null, payoutCompletedAt: Date | null) {
  if (!scheduleId) {
    return
  }

  const updateData: {
    lastPayoutAt?: Date | null
    nextPayoutScheduledAt?: Date | null
  } = {}

  if (payoutCompletedAt) {
    updateData.lastPayoutAt = payoutCompletedAt
    updateData.nextPayoutScheduledAt = null
  }

  if (Object.keys(updateData).length === 0) {
    return
  }

  await prisma.groupPayoutSchedule.updateMany({
    where: { id: scheduleId },
    data: updateData,
  })
}

async function upsertPayoutFromStripe(eventId: string, payout: Stripe.Payout) {
  const payoutMetadata = payout.metadata ?? null
  const payoutIdFromMetadata = readMetadataString(payoutMetadata, 'groupPayoutId')
  const groupIdFromMetadata = readMetadataString(payoutMetadata, 'groupId')
  const scheduleIdFromMetadata = readMetadataString(payoutMetadata, 'groupPayoutScheduleId')
  const transferIdFromMetadata =
    readMetadataString(payoutMetadata, 'transferId') ??
    readMetadataString(payoutMetadata, 'stripeTransferId') ??
    null

  let record = null

  if (payoutIdFromMetadata) {
    record = await prisma.groupPayout.findUnique({ where: { id: payoutIdFromMetadata } })
  }

  if (!record && payout.id) {
    record = await prisma.groupPayout.findUnique({ where: { stripePayoutId: payout.id } })
  }

  if (!record && transferIdFromMetadata) {
    record = await prisma.groupPayout.findFirst({ where: { stripeTransferId: transferIdFromMetadata } })
  }

  if (!record && groupIdFromMetadata) {
    record = await prisma.groupPayout.findFirst({
      where: { groupId: groupIdFromMetadata },
      orderBy: { initiatedAt: 'desc' },
    })
  }

  const status = mapPayoutStatus(payout.status)
  const initiatedAt = unixToDate(payout.created) ?? record?.initiatedAt ?? new Date()
  const completedAt = status === 'paid' ? unixToDate(payout.arrival_date) ?? new Date() : null
  const failureReason =
    status === 'failed'
      ? payout.failure_message ?? payout.failure_code ?? record?.failureReason ?? 'payout_failed'
      : null
  const amountCents = typeof payout.amount === 'number' ? payout.amount : record?.amountCents ?? 0
  const currency = typeof payout.currency === 'string' ? payout.currency.toUpperCase() : record?.currency ?? 'EUR'
  const metadataPayload = mergePayoutMetadata(record?.metadata ?? null, payout)

  if (!record) {
    if (!groupIdFromMetadata) {
      console.warn(`${logPrefix} payout event missing group context`, { eventId, payoutId: payout.id })
      return null
    }

    const createData: Parameters<typeof prisma.groupPayout.create>[0]['data'] = {
      groupId: groupIdFromMetadata,
      scheduleId: scheduleIdFromMetadata,
      amountCents,
      currency,
      status,
      initiatedAt,
      completedAt,
      failureReason,
      stripePayoutId: payout.id ?? null,
      stripeTransferId: transferIdFromMetadata,
      stripeLastEventId: eventId,
      metadata: metadataPayload as any,
    }

    const created = await prisma.groupPayout.create({
      data: createData,
    })

    await updateScheduleAfterPayout(scheduleIdFromMetadata, completedAt)

    return created
  }

  if (record.stripeLastEventId && record.stripeLastEventId === eventId) {
    return record
  }

  const updateData: Parameters<typeof prisma.groupPayout.update>[0]['data'] = {
    status,
    initiatedAt,
    stripeLastEventId: eventId,
    metadata: metadataPayload as any,
  }

  if (completedAt) {
    updateData.completedAt = completedAt
  } else if (status !== 'paid') {
    updateData.completedAt = null
  }

  if (status === 'failed') {
    updateData.failureReason = failureReason
  } else if (record.failureReason) {
    updateData.failureReason = null
  }

  if (payout.id) {
    updateData.stripePayoutId = payout.id
  }

  if (transferIdFromMetadata) {
    updateData.stripeTransferId = transferIdFromMetadata
  }

  if (scheduleIdFromMetadata) {
    updateData.scheduleId = scheduleIdFromMetadata
  }

  if (amountCents !== record.amountCents) {
    updateData.amountCents = amountCents
  }

  if (currency && currency !== record.currency) {
    updateData.currency = currency
  }

  await prisma.groupPayout.update({
    where: { id: record.id },
    data: updateData,
  })

  await updateScheduleAfterPayout(scheduleIdFromMetadata ?? record.scheduleId ?? null, completedAt)

  return prisma.groupPayout.findUnique({ where: { id: record.id } })
}

type MembershipContext = {
  groupId: string | null
  membershipId: string | null
  userId: string | null
}

type MembershipLookupParams = {
  paymentIntentId?: string | null
  chargeId?: string | null
  customerId?: string | null
  metadata?: Stripe.Metadata | Record<string, unknown> | null
}

async function resolveMembershipContext({
  paymentIntentId,
  chargeId,
  customerId,
  metadata,
}: MembershipLookupParams): Promise<MembershipContext> {
  let membership = null

  if (paymentIntentId) {
    membership = await prisma.groupMembership.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, groupId: true, userId: true },
    })
  }

  if (!membership && customerId) {
    membership = await prisma.groupMembership.findFirst({
      where: { stripeCustomerId: customerId },
      orderBy: { renewedAt: 'desc' },
      select: { id: true, groupId: true, userId: true },
    })
  }

  let revenueEntry = null
  if (!membership && chargeId) {
    revenueEntry = await prisma.groupRevenueEntry.findFirst({
      where: { stripeBalanceTransaction: chargeId },
      select: { groupId: true, membershipId: true, userId: true },
    })
  }

  const metadataRecord = (metadata ?? {}) as Record<string, unknown>

  const metadataGroupId = typeof metadataRecord.groupId === 'string' ? (metadataRecord.groupId as string) : null
  const metadataMembershipId =
    typeof metadataRecord.membershipId === 'string' ? (metadataRecord.membershipId as string) : null
  const metadataUserId = typeof metadataRecord.userId === 'string' ? (metadataRecord.userId as string) : null

  return {
    groupId: membership?.groupId ?? revenueEntry?.groupId ?? metadataGroupId,
    membershipId: membership?.id ?? revenueEntry?.membershipId ?? metadataMembershipId,
    userId: membership?.userId ?? revenueEntry?.userId ?? metadataUserId,
  }
}

async function upsertMembershipFromCheckout(eventId: string, session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {}
  const userId = metadata.userId ?? null
  const tierId = metadata.tierId ?? null
  const groupIdFromMetadata = metadata.groupId ?? null
  const couponIdFromMetadata = metadata.couponId ?? null
  const couponCodeFromMetadata = metadata.couponCode ?? null
  const descriptionFromMetadata = typeof metadata.description === 'string' ? metadata.description : null

  if (!userId) {
    console.warn(`${logPrefix} missing user metadata on checkout.session.completed`, { eventId })
    return null
  }

  const subscriptionId = asStripeId(session.subscription as any)
  const customerId = asStripeId(session.customer as any)
  const paymentIntentId = asStripeId(session.payment_intent as any)
  const promotionCode = session.total_details?.breakdown?.discounts?.[0]?.promotion_code ?? null

  let resolvedGroupId = groupIdFromMetadata
  let resolvedTierId: string | null = tierId
  let billingPeriod: string | null = null
  let resolvedCouponId = typeof couponIdFromMetadata === 'string' ? couponIdFromMetadata : null

  if (tierId) {
    const tier = await prisma.groupMembershipTier.findUnique({
      where: { id: tierId },
      select: { id: true, groupId: true, billingPeriod: true },
    })

    if (!tier) {
      console.warn(`${logPrefix} tier referenced by checkout metadata is missing`, {
        eventId,
        tierId,
      })
      resolvedTierId = null
    } else {
      resolvedGroupId = tier.groupId
      billingPeriod = tier.billingPeriod
    }
  }

  if (!resolvedGroupId) {
    console.warn(`${logPrefix} missing group context for checkout completion`, { eventId, userId })
    return null
  }

  const now = new Date()
  const expiresAt = calculateExpiration(now, billingPeriod)

  const existingMembership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId: resolvedGroupId,
        userId,
      },
    },
    select: {
      id: true,
      tierId: true,
      stripeSubscriptionId: true,
      status: true,
    },
  })

  const membership = await prisma.groupMembership.upsert({
    where: {
      groupId_userId: {
        groupId: resolvedGroupId,
        userId,
      },
    },
    create: {
      groupId: resolvedGroupId,
      userId,
      tierId: resolvedTierId,
      status: 'active',
      startedAt: now,
      renewedAt: now,
      expiresAt,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeLastEventId: eventId,
    },
    update: {
      tierId: resolvedTierId,
      status: 'active',
      renewedAt: now,
      expiresAt,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeLastEventId: eventId,
    },
    select: {
      id: true,
      groupId: true,
      userId: true,
      status: true,
      startedAt: true,
      tierId: true,
      stripeSubscriptionId: true,
    },
  })

  await syncGroupMemberStatus({
    groupId: membership.groupId,
    userId: membership.userId,
    status: membership.status,
    joinedAt: membership.startedAt,
  })

  const previousSubscriptionId = existingMembership?.stripeSubscriptionId ?? null
  const nextSubscriptionId = membership.stripeSubscriptionId ?? null

  if (
    previousSubscriptionId &&
    nextSubscriptionId &&
    previousSubscriptionId !== nextSubscriptionId &&
    existingMembership?.status !== 'canceled'
  ) {
    const stripe = getStripeClient()
    if (!stripe) {
      console.warn(`${logPrefix} missing Stripe client for subscription transition`, {
        eventId,
        previousSubscriptionId,
        nextSubscriptionId,
      })
    } else {
      try {
        // membership_transition: auto-upgrade-cancel-old
        await stripe.subscriptions.cancel(previousSubscriptionId)
      } catch (error) {
        console.error(`${logPrefix} failed to cancel superseded subscription`, {
          eventId,
          previousSubscriptionId,
          nextSubscriptionId,
          error,
        })
      }
    }
  }

  if (!resolvedCouponId && promotionCode) {
    const couponRecord = await prisma.groupMembershipCoupon.findFirst({
      where: { stripePromotionCodeId: promotionCode },
      select: { id: true },
    })

    resolvedCouponId = couponRecord?.id ?? null
  }

  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null
  const currency = typeof session.currency === 'string' ? session.currency : null
  const occurredAt = unixToDate(session.created) ?? now

  if (session.mode !== 'subscription' && amountTotal !== null && currency) {
    const result = await upsertRevenueEntry({
      groupId: membership.groupId,
      membershipId: membership.id,
      userId: membership.userId,
      couponId: resolvedCouponId,
      type: RevenueEntryType.membership_charge,
      amountGrossCents: amountTotal,
      currency,
      occurredAt,
      stripeEventId: eventId,
      stripeObjectId: session.id,
      metadata: {
        source: 'checkout.session.completed',
        mode: session.mode ?? null,
        promotionCode: session.total_details?.breakdown?.discounts?.[0]?.promotion_code ?? null,
        couponCode: couponCodeFromMetadata ?? null,
      },
    })

    if (resolvedCouponId && result.created) {
      await recordCouponRedemption(resolvedCouponId, eventId)
    }

    if (result.created) {
      try {
        await sendMembershipReceiptNotification({
          groupId: membership.groupId,
          membershipId: membership.id,
          userId: membership.userId,
          amountCents: amountTotal,
          currency,
          occurredAt,
          stripeEventId: eventId,
          stripePaymentIntentId: paymentIntentId,
          couponCode: typeof couponCodeFromMetadata === 'string' ? couponCodeFromMetadata : null,
          description: descriptionFromMetadata,
        })
      } catch (error) {
        console.error(`${logPrefix} receipt dispatch failed`, { eventId, error })
      }
    }
  }

  return membership
}

type SubscriptionUpdatePayload = {
  status?: 'active' | 'past_due' | 'canceled'
  renewedAt?: Date | null
  expiresAt?: Date | null
  stripeCustomerId?: string | null
  stripePaymentIntentId?: string | null
}

async function updateMembershipBySubscription(
  eventId: string,
  subscriptionId: string,
  data: SubscriptionUpdatePayload,
) {
  const membership = await prisma.groupMembership.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true, groupId: true, userId: true, stripeLastEventId: true },
  })

  if (!membership) {
    console.warn(`${logPrefix} subscription lookup failed`, { eventId, subscriptionId })
    return null
  }

  if (membership.stripeLastEventId === eventId) {
    return null
  }

  const updated = await prisma.groupMembership.update({
    where: { id: membership.id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.renewedAt !== undefined ? { renewedAt: data.renewedAt } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
      ...(data.stripeCustomerId !== undefined ? { stripeCustomerId: data.stripeCustomerId } : {}),
      ...(data.stripePaymentIntentId !== undefined ? { stripePaymentIntentId: data.stripePaymentIntentId } : {}),
      stripeLastEventId: eventId,
    },
    select: {
      id: true,
      groupId: true,
      userId: true,
      status: true,
      startedAt: true,
    },
  })

  await syncGroupMemberStatus({
    groupId: updated.groupId,
    userId: updated.userId,
    status: updated.status,
    joinedAt: updated.startedAt,
  })

  return updated
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' {
  if (status === 'active' || status === 'trialing') {
    return 'active'
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    return 'canceled'
  }

  return 'past_due'
}

async function handleSubscriptionChange(eventId: string, subscription: Stripe.Subscription, overrideStatus?: 'active' | 'past_due' | 'canceled') {
  const subscriptionId = subscription.id
  const customerId = asStripeId(subscription.customer as any)
  const status = overrideStatus ?? mapSubscriptionStatus(subscription.status)
  const expiresAt = unixToDate(subscription.current_period_end ?? null)

  await updateMembershipBySubscription(eventId, subscriptionId, {
    status,
    renewedAt: unixToDate(subscription.current_period_start ?? null) ?? new Date(),
    expiresAt,
    stripeCustomerId: customerId,
  })
}

async function handleInvoicePayment(eventId: string, invoice: Stripe.Invoice, isFailure: boolean) {
  const subscriptionId = asStripeId(invoice.subscription as any)
  if (!subscriptionId) {
    console.warn(`${logPrefix} invoice missing subscription reference`, { eventId, invoiceId: invoice.id })
    return
  }

  const paymentIntentId = asStripeId(invoice.payment_intent as any)
  const customerId = asStripeId(invoice.customer as any)
  const periodEnd = unixToDate(invoice.lines.data[0]?.period?.end)
  const paidAt = unixToDate(invoice.status_transitions?.paid_at ?? null) ?? unixToDate(invoice.created) ?? new Date()

  const membership = await updateMembershipBySubscription(eventId, subscriptionId, {
    status: isFailure ? 'past_due' : 'active',
    renewedAt: isFailure ? undefined : paidAt,
    expiresAt: periodEnd ?? null,
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId: customerId,
  })

  if (!isFailure && membership) {
    const gross = typeof invoice.total === 'number' ? invoice.total : invoice.amount_paid ?? null
    const net = typeof invoice.amount_paid === 'number' ? invoice.amount_paid : gross
    const currency = typeof invoice.currency === 'string' ? invoice.currency : null
    const chargeId = asStripeId(invoice.charge as any)
    const promotionCode = invoice.discount?.promotion_code ?? null
    let couponId: string | null = null

    if (promotionCode) {
      const couponRecord = await findCouponByStripePromotionCode(promotionCode)
      couponId = couponRecord?.id ?? null
    }

    if (gross !== null && net !== null && currency) {
      const result = await upsertRevenueEntry({
        groupId: membership.groupId,
        membershipId: membership.id,
        userId: membership.userId,
        couponId,
        type: RevenueEntryType.membership_charge,
        amountGrossCents: gross,
        amountNetCents: net,
        currency,
        occurredAt: paidAt ?? new Date(),
        stripeEventId: eventId,
        stripeObjectId: invoice.id,
        stripeBalanceTransaction: chargeId,
        metadata: {
          source: isFailure ? 'invoice.payment_failed' : 'invoice.payment_succeeded',
          invoiceNumber: invoice.number ?? null,
          subscriptionId,
          promotionCode,
        },
      })

      if (couponId && result.created) {
        await recordCouponRedemption(couponId, eventId)
      }

      if (result.created) {
        try {
          await sendMembershipReceiptNotification({
            groupId: membership.groupId,
            membershipId: membership.id,
            userId: membership.userId,
            amountCents: gross,
            currency,
            occurredAt: paidAt ?? new Date(),
            stripeEventId: eventId,
            stripeChargeId: chargeId,
            stripePaymentIntentId: paymentIntentId,
            invoiceNumber: invoice.number ?? null,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
            couponCode: promotionCode,
            description: invoice.lines.data[0]?.description ?? null,
          })
        } catch (error) {
          console.error(`${logPrefix} receipt dispatch failed`, { eventId, invoiceId: invoice.id, error })
        }
      }
    }
  }
}

async function handleChargeRefund(eventId: string, charge: Stripe.Charge) {
  const chargeId = charge.id
  if (!chargeId) {
    console.warn(`${logPrefix} refund missing charge id`, { eventId })
    return
  }

  const paymentIntentId = asStripeId(charge.payment_intent as any)
  const customerId = asStripeId(charge.customer as any)
  const context = await resolveMembershipContext({
    paymentIntentId,
    chargeId,
    customerId,
    metadata: charge.metadata ?? null,
  })

  if (!context.groupId) {
    console.warn(`${logPrefix} refund without group context`, { eventId, chargeId })
    return
  }

  const refunds = Array.isArray(charge.refunds?.data) ? charge.refunds.data : []
  let totalRefunded = 0

  for (const refund of refunds) {
    const refundId = typeof refund.id === 'string' ? refund.id : null
    const amount = typeof refund.amount === 'number' ? refund.amount : null
    if (!refundId || amount === null) {
      continue
    }

    const status = mapRefundStatus(refund.status)
    if (status === 'succeeded') {
      totalRefunded += amount
    }

    await upsertPaymentRefund({
      groupId: context.groupId,
      membershipId: context.membershipId,
      userId: context.userId,
      stripeRefundId: refundId,
      stripeChargeId: chargeId,
      stripePaymentIntentId: paymentIntentId,
      stripeEventId: eventId,
      amountCents: amount,
      currency: (refund.currency ?? charge.currency ?? 'eur') as string,
      reason: refund.reason ?? null,
      status,
      failureReason: refund.failure_reason ?? null,
      refundedAt: unixToDate(refund.created) ?? unixToDate(charge.created) ?? null,
      metadata: {
        balanceTransaction: refund.balance_transaction ?? null,
        paymentIntentId,
      },
    })
  }

  if (totalRefunded > 0) {
    const occurredAt = unixToDate(charge.created) ?? new Date()
    const balanceTransaction = asStripeId(charge.balance_transaction as any)
    const currency = typeof charge.currency === 'string' ? charge.currency : (refunds[0]?.currency ?? 'eur')

    await upsertRevenueEntry({
      groupId: context.groupId,
      membershipId: context.membershipId ?? undefined,
      userId: context.userId ?? undefined,
      type: RevenueEntryType.membership_refund,
      amountGrossCents: -totalRefunded,
      currency: currency ?? 'eur',
      occurredAt,
      stripeEventId: eventId,
      stripeObjectId: chargeId,
      stripeBalanceTransaction: balanceTransaction ?? undefined,
      metadata: {
        source: 'charge.refunded',
        paymentIntentId,
        refundIds: refunds.map((refund) => (typeof refund.id === 'string' ? refund.id : null)),
      },
    })
  }
}

async function handleDisputeCreated(eventId: string, dispute: Stripe.Dispute) {
  const disputeId = dispute.id
  const chargeId = asStripeId(dispute.charge as any)
  if (!disputeId || !chargeId) {
    console.warn(`${logPrefix} dispute missing identifiers`, { eventId })
    return
  }

  const paymentIntentId = asStripeId(dispute.payment_intent as any)
  const customerId = asStripeId(dispute.customer as any)
  const context = await resolveMembershipContext({
    paymentIntentId,
    chargeId,
    customerId,
    metadata: dispute.metadata ?? null,
  })

  if (!context.groupId) {
    console.warn(`${logPrefix} dispute without group context`, { eventId, disputeId })
    return
  }

  await upsertPaymentDispute({
    groupId: context.groupId,
    membershipId: context.membershipId,
    userId: context.userId,
    stripeDisputeId: disputeId,
    stripeChargeId: chargeId,
    stripePaymentIntentId: paymentIntentId,
    stripeEventId: eventId,
    amountCents: typeof dispute.amount === 'number' ? dispute.amount : 0,
    currency: (dispute.currency ?? 'eur') as string,
    reason: dispute.reason ?? null,
    status: mapDisputeStatus(dispute.status),
    evidenceDueAt: unixToDate(dispute.evidence_details?.due_by ?? null),
    metadata: {
      evidenceDetails: dispute.evidence_details ?? null,
      paymentIntentId,
    },
  })
}

async function handleDisputeClosure(eventId: string, dispute: Stripe.Dispute) {
  const disputeId = dispute.id
  const chargeId = asStripeId(dispute.charge as any)
  if (!disputeId || !chargeId) {
    console.warn(`${logPrefix} dispute closure missing identifiers`, { eventId })
    return
  }

  const paymentIntentId = asStripeId(dispute.payment_intent as any)
  const customerId = asStripeId(dispute.customer as any)
  const context = await resolveMembershipContext({
    paymentIntentId,
    chargeId,
    customerId,
    metadata: dispute.metadata ?? null,
  })

  if (!context.groupId) {
    console.warn(`${logPrefix} dispute closure without group context`, { eventId, disputeId })
    return
  }

  const status = mapDisputeStatus(dispute.status)
  const amount = typeof dispute.amount === 'number' ? dispute.amount : 0
  const closedAt = unixToDate(dispute.closed_at ?? null) ?? new Date()

  await upsertPaymentDispute({
    groupId: context.groupId,
    membershipId: context.membershipId,
    userId: context.userId,
    stripeDisputeId: disputeId,
    stripeChargeId: chargeId,
    stripePaymentIntentId: paymentIntentId,
    stripeEventId: eventId,
    amountCents: amount,
    currency: (dispute.currency ?? 'eur') as string,
    reason: dispute.reason ?? null,
    status,
    evidenceDueAt: unixToDate(dispute.evidence_details?.due_by ?? null),
    closedAt,
    metadata: {
      networkReasonCode: dispute.network_reason_code ?? null,
      outcome: dispute.outcome ?? null,
      paymentIntentId,
    },
  })

  if (status === 'lost' && amount > 0) {
    const balanceTransactionsRaw = (dispute as any).balance_transactions
    const balanceTransactions = Array.isArray(balanceTransactionsRaw?.data)
      ? (balanceTransactionsRaw.data as Array<{ id: string }>)
      : Array.isArray(balanceTransactionsRaw)
        ? (balanceTransactionsRaw as Array<{ id: string }>)
        : []
    const balanceTransactionId =
      balanceTransactions.length > 0 ? asStripeId(balanceTransactions[0] as any) ?? undefined : undefined

    await upsertRevenueEntry({
      groupId: context.groupId,
      membershipId: context.membershipId ?? undefined,
      userId: context.userId ?? undefined,
      type: RevenueEntryType.membership_chargeback,
      amountGrossCents: -amount,
      currency: (dispute.currency ?? 'eur') as string,
      occurredAt: closedAt,
      stripeEventId: eventId,
      stripeObjectId: disputeId,
      stripeBalanceTransaction: balanceTransactionId,
      metadata: {
        source: 'charge.dispute.closed',
        status: dispute.status ?? null,
        paymentIntentId,
      },
    })
  }
}

const eventHandlers: Partial<Record<string, (event: Stripe.Event) => Promise<void>>> = {
  'checkout.session.completed': async (event) => {
    const session = event.data.object as Stripe.Checkout.Session
    await upsertMembershipFromCheckout(event.id, session)
  },
  'customer.subscription.updated': async (event) => {
    const subscription = event.data.object as Stripe.Subscription
    await handleSubscriptionChange(event.id, subscription)
  },
  'customer.subscription.deleted': async (event) => {
    const subscription = event.data.object as Stripe.Subscription
    await handleSubscriptionChange(event.id, subscription, 'canceled')
  },
  'invoice.payment_succeeded': async (event) => {
    const invoice = event.data.object as Stripe.Invoice
    await handleInvoicePayment(event.id, invoice, false)
  },
  'invoice.payment_failed': async (event) => {
    const invoice = event.data.object as Stripe.Invoice
    await handleInvoicePayment(event.id, invoice, true)
  },
  'charge.refunded': async (event) => {
    const charge = event.data.object as Stripe.Charge
    await handleChargeRefund(event.id, charge)
  },
  'charge.dispute.created': async (event) => {
    const dispute = event.data.object as Stripe.Dispute
    await handleDisputeCreated(event.id, dispute)
  },
  'charge.dispute.updated': async (event) => {
    const dispute = event.data.object as Stripe.Dispute
    await handleDisputeCreated(event.id, dispute)
  },
  'charge.dispute.closed': async (event) => {
    const dispute = event.data.object as Stripe.Dispute
    await handleDisputeClosure(event.id, dispute)
  },
  'charge.dispute.funds_reinstated': async (event) => {
    const dispute = event.data.object as Stripe.Dispute
    await handleDisputeClosure(event.id, dispute)
  },
  'payout.created': async (event) => {
    const payout = event.data.object as Stripe.Payout
    await upsertPayoutFromStripe(event.id, payout)
  },
  'payout.updated': async (event) => {
    const payout = event.data.object as Stripe.Payout
    await upsertPayoutFromStripe(event.id, payout)
  },
  'payout.paid': async (event) => {
    const payout = event.data.object as Stripe.Payout
    await upsertPayoutFromStripe(event.id, payout)
  },
  'payout.failed': async (event) => {
    const payout = event.data.object as Stripe.Payout
    await upsertPayoutFromStripe(event.id, payout)
  },
  'payout.canceled': async (event) => {
    const payout = event.data.object as Stripe.Payout
    await upsertPayoutFromStripe(event.id, payout)
  },
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error(`${logPrefix} STRIPE_WEBHOOK_SECRET missing`)
    return NextResponse.json({ error: 'WEBHOOK_SECRET_MISSING' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'SIGNATURE_REQUIRED' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error(`${logPrefix} signature verification failed`, error)
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 })
  }

  const handler = eventHandlers[event.type]
  if (!handler) {
    return NextResponse.json({ received: true, ignored: event.type }, { status: 200 })
  }

  try {
    await handler(event)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error(`${logPrefix} handler failed`, { eventId: event.id, type: event.type, error })
    return NextResponse.json({ error: 'WEBHOOK_HANDLER_ERROR' }, { status: 500 })
  }
}
