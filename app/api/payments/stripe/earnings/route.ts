// feature: commerce-revenue
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getGroupRevenueSummary, listRevenueEntries } from '@/lib/payments/revenue'

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const numeric = Number.parseInt(value, 10)
  if (Number.isNaN(numeric) || numeric <= 0) {
    return undefined
  }

  return Math.min(numeric, 100)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const url = new URL(request.url)
  const groupId = url.searchParams.get('groupId')
  const limit = parseLimit(url.searchParams.get('limit'))

  if (!groupId) {
    return NextResponse.json({ error: 'GROUP_ID_REQUIRED' }, { status: 400 })
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  })

  if (!group) {
    return NextResponse.json({ error: 'GROUP_NOT_FOUND' }, { status: 404 })
  }

  let authorized = group.ownerId === userId
  if (!authorized) {
    const admin = await prisma.groupAdmin.findFirst({ where: { groupId, userId } })
    authorized = Boolean(admin)
  }

  if (!authorized) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const [summary, entries] = await Promise.all([
    getGroupRevenueSummary(groupId),
    listRevenueEntries({ groupId, limit }),
  ])

  return NextResponse.json({
    groupId,
    summary,
    entries,
  })
}
