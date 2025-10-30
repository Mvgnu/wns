// feature: commerce-checkout
import crypto from 'node:crypto'

import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getStripeClient, syncTierWithStripe } from '@/lib/payments/stripe'
import {
  findActiveCouponByCode,
  normalizeCouponCode,
  syncCouponWithStripe,
  validateCouponApplicability,
} from '@/lib/payments/coupons'

type CheckoutRequestBody = {
  tierId?: string
  successUrl?: string
  cancelUrl?: string
  quantity?: number
  couponCode?: string
}

type CheckoutResponse = {
  sessionId: string
  url: string | null
  mode: 'payment' | 'subscription'
}

function resolveBaseUrl(): string {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

function resolveRedirectUrl(baseUrl: string, slug: string | null, fallbackPath: string, override?: string) {
  if (override) {
    return override
  }

  const safeSlug = slug || 'group'
  return `${baseUrl}/groups/${safeSlug}?checkout=${fallbackPath}`
}

function coerceQuantity(raw: number | undefined): number {
  if (!Number.isFinite(raw)) {
    return 1
  }

  const parsed = Math.trunc(Number(raw))
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 1
  }

  return Math.min(parsed, 10)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody

    if (!body.tierId) {
      return NextResponse.json({ error: 'TIER_ID_REQUIRED' }, { status: 400 })
    }

    const tier = await prisma.groupMembershipTier.findUnique({
      where: { id: body.tierId },
      include: {
        group: {
          select: { id: true, slug: true, name: true },
        },
      },
    })

    if (!tier) {
      return NextResponse.json({ error: 'TIER_NOT_FOUND' }, { status: 404 })
    }

    let coupon = null as (Awaited<ReturnType<typeof findActiveCouponByCode>> | null)
    let promotionCodeId: string | null = null

    if (body.couponCode) {
      const normalizedCode = normalizeCouponCode(body.couponCode)
      coupon = await findActiveCouponByCode(tier.groupId, normalizedCode)

      if (!coupon) {
        return NextResponse.json({ error: 'COUPON_NOT_FOUND' }, { status: 404 })
      }

      const applicability = await validateCouponApplicability(coupon.id)
      if (!applicability.ok) {
        return NextResponse.json({ error: applicability.reason ?? 'COUPON_INVALID' }, { status: 409 })
      }

      if (
        coupon.discountType === 'fixed_amount' &&
        coupon.currency &&
        coupon.currency.toUpperCase() !== tier.currency.toUpperCase()
      ) {
        return NextResponse.json({ error: 'COUPON_CURRENCY_MISMATCH' }, { status: 422 })
      }

      const syncResult = await syncCouponWithStripe({
        code: coupon.code,
        discountType: coupon.discountType,
        percentageOff: coupon.percentageOff ?? undefined,
        amountOffCents: coupon.amountOffCents ?? undefined,
        currency: coupon.currency ?? undefined,
        maxRedemptions: coupon.maxRedemptions ?? undefined,
        startsAt: coupon.startsAt ?? undefined,
        endsAt: coupon.endsAt ?? undefined,
        stripeCouponId: coupon.stripeCouponId,
        stripePromotionCodeId: coupon.stripePromotionCodeId,
      })

      if (!syncResult.skipped) {
        coupon = await prisma.groupMembershipCoupon.update({
          where: { id: coupon.id },
          data: {
            stripeCouponId: syncResult.couponId,
            stripePromotionCodeId: syncResult.promotionCodeId,
          },
        })
      }

      promotionCodeId = coupon.stripePromotionCodeId ?? syncResult.promotionCodeId ?? null

      if (!promotionCodeId) {
        return NextResponse.json({ error: 'COUPON_NOT_READY' }, { status: 422 })
      }
    }

    const syncResult = await syncTierWithStripe({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      currency: tier.currency,
      priceCents: tier.priceCents,
      billingPeriod: tier.billingPeriod,
      stripeProductId: tier.stripeProductId,
      stripePriceId: tier.stripePriceId,
    })

    let priceId = tier.stripePriceId ?? null
    if (!syncResult.skipped) {
      priceId = syncResult.priceId
      await prisma.groupMembershipTier.update({
        where: { id: tier.id },
        data: {
          stripeProductId: syncResult.productId,
          stripePriceId: syncResult.priceId,
        },
      })
    }

    if (!priceId) {
      return NextResponse.json({ error: 'PRICE_NOT_AVAILABLE' }, { status: 422 })
    }

    const mode: 'payment' | 'subscription' = tier.billingPeriod === 'once' ? 'payment' : 'subscription'
    const baseUrl = resolveBaseUrl()
    const successUrl = resolveRedirectUrl(baseUrl, tier.group.slug, 'success', body.successUrl)
    const cancelUrl = resolveRedirectUrl(baseUrl, tier.group.slug, 'cancelled', body.cancelUrl)
    const quantity = coerceQuantity(body.quantity)

    const idempotencyKey =
      request.headers.get('Idempotency-Key') ||
      crypto.createHash('sha256').update(`${session.user.id}:${tier.id}:${quantity}`).digest('hex')

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode,
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        ...(promotionCodeId
          ? {
              discounts: [
                {
                  promotion_code: promotionCodeId,
                },
              ],
            }
          : {}),
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: session.user.email ?? undefined,
        client_reference_id: `${session.user.id}:${tier.id}`,
        metadata: {
          context: 'membership-tier',
          groupId: tier.groupId,
          tierId: tier.id,
          userId: session.user.id,
          ...(coupon
            ? {
                couponId: coupon.id,
                couponCode: coupon.code,
              }
            : {}),
        },
        allow_promotion_codes: true,
      },
      {
        idempotencyKey,
      },
    )

    const payload: CheckoutResponse = {
      sessionId: checkoutSession.id,
      url: checkoutSession.url ?? null,
      mode,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error('[payments] checkout session creation failed', error)
    return NextResponse.json({ error: 'CHECKOUT_ERROR' }, { status: 500 })
  }
}
