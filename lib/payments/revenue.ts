// feature: commerce-revenue
import type { GroupRevenueEntry, Prisma, RevenueEntryType } from '@prisma/client'

import prisma from '@/lib/prisma'

export type RevenueEntryPayload = {
  groupId: string
  membershipId?: string | null
  userId?: string | null
  couponId?: string | null
  type: RevenueEntryType
  amountGrossCents: number
  amountNetCents?: number | null
  feeCents?: number | null
  currency: string
  occurredAt: Date
  stripeEventId: string
  stripeObjectId?: string | null
  stripeBalanceTransaction?: string | null
  metadata?: Record<string, unknown> | null
}

export type UpsertRevenueResult = {
  entry: GroupRevenueEntry
  created: boolean
}

export async function upsertRevenueEntry(payload: RevenueEntryPayload): Promise<UpsertRevenueResult> {
  const net = payload.amountNetCents ?? payload.amountGrossCents - (payload.feeCents ?? 0)
  const fee = payload.feeCents ?? Math.max(payload.amountGrossCents - net, 0)

  const data: Prisma.GroupRevenueEntryUncheckedCreateInput = {
    groupId: payload.groupId,
    membershipId: payload.membershipId ?? undefined,
    userId: payload.userId ?? undefined,
    couponId: payload.couponId ?? undefined,
    type: payload.type,
    amountGrossCents: payload.amountGrossCents,
    amountNetCents: net,
    feeCents: fee,
    currency: payload.currency.toUpperCase(),
    occurredAt: payload.occurredAt,
    stripeEventId: payload.stripeEventId,
    stripeObjectId: payload.stripeObjectId ?? undefined,
    stripeBalanceTransaction: payload.stripeBalanceTransaction ?? undefined,
    metadata: payload.metadata ?? undefined,
  }

  const existing = await prisma.groupRevenueEntry.findUnique({
    where: { stripeEventId: payload.stripeEventId },
  })

  if (existing) {
    const entry = await prisma.groupRevenueEntry.update({
      where: { stripeEventId: payload.stripeEventId },
      data,
    })

    return { entry, created: false }
  }

  const entry = await prisma.groupRevenueEntry.create({ data })
  return { entry, created: true }
}

export type RevenueSummary = {
  currency: string
  grossCents: number
  netCents: number
  feeCents: number
  transactionCount: number
}

export async function getGroupRevenueSummary(groupId: string): Promise<RevenueSummary[]> {
  const grouped = await prisma.groupRevenueEntry.groupBy({
    by: ['currency'],
    where: { groupId },
    _sum: { amountGrossCents: true, amountNetCents: true, feeCents: true },
    _count: { _all: true },
  })

  return grouped.map((row) => ({
    currency: row.currency,
    grossCents: row._sum.amountGrossCents ?? 0,
    netCents: row._sum.amountNetCents ?? 0,
    feeCents: row._sum.feeCents ?? 0,
    transactionCount: row._count._all,
  }))
}

export type RevenueEntryListParams = {
  groupId: string
  limit?: number
}

export async function listRevenueEntries({ groupId, limit = 25 }: RevenueEntryListParams) {
  return prisma.groupRevenueEntry.findMany({
    where: { groupId },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  })
}
