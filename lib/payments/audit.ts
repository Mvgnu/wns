// feature: commerce-audit
import type {
  GroupPaymentDispute,
  GroupPaymentRefund,
  PaymentDisputeStatus,
  PaymentRefundStatus,
} from '@prisma/client'

import prisma from '@/lib/prisma'

export type PaymentRefundPayload = {
  groupId: string
  membershipId?: string | null
  userId?: string | null
  stripeRefundId: string
  stripeChargeId: string
  stripePaymentIntentId?: string | null
  stripeEventId: string
  amountCents: number
  currency: string
  reason?: string | null
  status: PaymentRefundStatus
  failureReason?: string | null
  refundedAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export async function upsertPaymentRefund(payload: PaymentRefundPayload): Promise<GroupPaymentRefund> {
  return prisma.groupPaymentRefund.upsert({
    where: { stripeRefundId: payload.stripeRefundId },
    create: {
      groupId: payload.groupId,
      membershipId: payload.membershipId ?? undefined,
      userId: payload.userId ?? undefined,
      stripeRefundId: payload.stripeRefundId,
      stripeChargeId: payload.stripeChargeId,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? undefined,
      stripeEventId: payload.stripeEventId,
      amountCents: payload.amountCents,
      currency: payload.currency.toUpperCase(),
      reason: payload.reason ?? undefined,
      status: payload.status,
      failureReason: payload.failureReason ?? undefined,
      refundedAt: payload.refundedAt ?? undefined,
      metadata: payload.metadata ?? undefined,
    },
    update: {
      membershipId: payload.membershipId ?? undefined,
      userId: payload.userId ?? undefined,
      stripeChargeId: payload.stripeChargeId,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? undefined,
      stripeEventId: payload.stripeEventId,
      amountCents: payload.amountCents,
      currency: payload.currency.toUpperCase(),
      reason: payload.reason ?? undefined,
      status: payload.status,
      failureReason: payload.failureReason ?? undefined,
      refundedAt: payload.refundedAt ?? undefined,
      metadata: payload.metadata ?? undefined,
    },
  })
}

export type PaymentDisputePayload = {
  groupId: string
  membershipId?: string | null
  userId?: string | null
  stripeDisputeId: string
  stripeChargeId: string
  stripePaymentIntentId?: string | null
  stripeEventId: string
  amountCents: number
  currency: string
  reason?: string | null
  status: PaymentDisputeStatus
  evidenceDueAt?: Date | null
  closedAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export async function upsertPaymentDispute(payload: PaymentDisputePayload): Promise<GroupPaymentDispute> {
  return prisma.groupPaymentDispute.upsert({
    where: { stripeDisputeId: payload.stripeDisputeId },
    create: {
      groupId: payload.groupId,
      membershipId: payload.membershipId ?? undefined,
      userId: payload.userId ?? undefined,
      stripeDisputeId: payload.stripeDisputeId,
      stripeChargeId: payload.stripeChargeId,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? undefined,
      stripeEventId: payload.stripeEventId,
      amountCents: payload.amountCents,
      currency: payload.currency.toUpperCase(),
      reason: payload.reason ?? undefined,
      status: payload.status,
      evidenceDueAt: payload.evidenceDueAt ?? undefined,
      closedAt: payload.closedAt ?? undefined,
      metadata: payload.metadata ?? undefined,
    },
    update: {
      membershipId: payload.membershipId ?? undefined,
      userId: payload.userId ?? undefined,
      stripeChargeId: payload.stripeChargeId,
      stripePaymentIntentId: payload.stripePaymentIntentId ?? undefined,
      stripeEventId: payload.stripeEventId,
      amountCents: payload.amountCents,
      currency: payload.currency.toUpperCase(),
      reason: payload.reason ?? undefined,
      status: payload.status,
      evidenceDueAt: payload.evidenceDueAt ?? undefined,
      closedAt: payload.closedAt ?? undefined,
      metadata: payload.metadata ?? undefined,
    },
  })
}
