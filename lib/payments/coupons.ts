// feature: commerce-coupons
import type { MembershipDiscountType } from '@prisma/client'
import Stripe from 'stripe'

import prisma from '@/lib/prisma'
import { getStripeClient } from '@/lib/payments/stripe'

const couponLogPrefix = '[payments] coupon'

type CouponStripeContext = {
  code: string
  discountType: MembershipDiscountType
  percentageOff?: number | null
  amountOffCents?: number | null
  currency?: string | null
  maxRedemptions?: number | null
  startsAt?: Date | null
  endsAt?: Date | null
  stripeCouponId?: string | null
  stripePromotionCodeId?: string | null
}

type StripeSyncResult = {
  couponId: string | null
  promotionCodeId: string | null
  skipped: boolean
}

function toUnixTimestamp(date: Date | null | undefined): number | undefined {
  if (!date) {
    return undefined
  }

  return Math.floor(date.getTime() / 1000)
}

function buildCouponParams(context: CouponStripeContext): Stripe.CouponCreateParams {
  if (context.discountType === 'percentage') {
    return {
      percent_off: context.percentageOff ?? undefined,
      duration: 'once',
      metadata: { source: 'group-membership', code: context.code },
    }
  }

  return {
    currency: (context.currency ?? 'EUR').toLowerCase(),
    amount_off: context.amountOffCents ?? undefined,
    duration: 'once',
    metadata: { source: 'group-membership', code: context.code },
  }
}

export async function syncCouponWithStripe(context: CouponStripeContext): Promise<StripeSyncResult> {
  const client = getStripeClient()
  if (!client) {
    return {
      couponId: context.stripeCouponId ?? null,
      promotionCodeId: context.stripePromotionCodeId ?? null,
      skipped: true,
    }
  }

  let couponId = context.stripeCouponId ?? null
  if (!couponId) {
    const coupon = await client.coupons.create(buildCouponParams(context))
    couponId = coupon.id
  }

  let promotionCodeId = context.stripePromotionCodeId ?? null

  if (!promotionCodeId) {
    const createPayload: Stripe.PromotionCodeCreateParams = {
      coupon: couponId,
      code: context.code,
      active: true,
    }

    if (context.maxRedemptions != null) {
      createPayload.max_redemptions = context.maxRedemptions
    }

    if (context.endsAt) {
      createPayload.expires_at = toUnixTimestamp(context.endsAt)
    }

    const created = await client.promotionCodes.create(createPayload)
    promotionCodeId = created.id
  } else {
    const updatePayload: Stripe.PromotionCodeUpdateParams = { active: true }

    if (context.maxRedemptions != null) {
      updatePayload.max_redemptions = context.maxRedemptions
    }

    if (context.endsAt) {
      updatePayload.expires_at = toUnixTimestamp(context.endsAt)
    }

    await client.promotionCodes.update(promotionCodeId, updatePayload)
  }

  return { couponId, promotionCodeId, skipped: false }
}

type CouponValidation = {
  ok: boolean
  reason?: string
}

export async function validateCouponApplicability(couponId: string): Promise<CouponValidation> {
  const coupon = await prisma.groupMembershipCoupon.findUnique({
    where: { id: couponId },
    select: {
      isActive: true,
      maxRedemptions: true,
      redemptionCount: true,
      startsAt: true,
      endsAt: true,
    },
  })

  if (!coupon) {
    return { ok: false, reason: 'COUPON_NOT_FOUND' }
  }

  const now = new Date()

  if (!coupon.isActive) {
    return { ok: false, reason: 'COUPON_INACTIVE' }
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: 'COUPON_NOT_ACTIVE' }
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, reason: 'COUPON_EXPIRED' }
  }

  if (
    typeof coupon.maxRedemptions === 'number' &&
    coupon.maxRedemptions >= 0 &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return { ok: false, reason: 'COUPON_LIMIT_REACHED' }
  }

  return { ok: true }
}

export async function recordCouponRedemption(couponId: string, eventId: string) {
  await prisma.groupMembershipCoupon.update({
    where: { id: couponId },
    data: {
      redemptionCount: {
        increment: 1,
      },
    },
  })

  console.info(`${couponLogPrefix} redemption recorded`, { couponId, eventId })
}

export async function deactivateStripePromotion(promotionCodeId: string | null | undefined) {
  if (!promotionCodeId) {
    return
  }

  const client = getStripeClient()
  if (!client) {
    return
  }

  await client.promotionCodes.update(promotionCodeId, { active: false })
}

export function normalizeCouponCode(code: string): string {
  return code
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
}

export async function findActiveCouponByCode(groupId: string, code: string) {
  const normalized = normalizeCouponCode(code)

  return prisma.groupMembershipCoupon.findFirst({
    where: {
      groupId,
      code: normalized,
      isActive: true,
    },
  })
}

export async function findCouponByStripePromotionCode(promotionCodeId: string | null | undefined) {
  if (!promotionCodeId) {
    return null
  }

  return prisma.groupMembershipCoupon.findFirst({
    where: { stripePromotionCodeId: promotionCodeId },
  })
}

export function validateCouponAmount(
  discountType: MembershipDiscountType,
  percentageOff?: number | null,
  amountOffCents?: number | null,
): CouponValidation {
  if (discountType === 'percentage') {
    if (typeof percentageOff !== 'number') {
      return { ok: false, reason: 'PERCENT_REQUIRED' }
    }

    if (percentageOff <= 0 || percentageOff > 100) {
      return { ok: false, reason: 'PERCENT_RANGE' }
    }

    return { ok: true }
  }

  if (typeof amountOffCents !== 'number') {
    return { ok: false, reason: 'AMOUNT_REQUIRED' }
  }

  if (amountOffCents <= 0) {
    return { ok: false, reason: 'AMOUNT_POSITIVE' }
  }

  return { ok: true }
}
