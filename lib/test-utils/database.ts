import { PrismaClient } from '@prisma/client'
import type { MembershipBillingPeriod, MembershipDiscountType } from '@prisma/client'

const prisma = new PrismaClient()

export interface TestUser {
  id: string
  name: string | null
  email: string | null
}

export interface TestGroup {
  id: string
  name: string
  isPrivate: boolean
  ownerId: string
}

export interface TestEvent {
  id: string
  title: string
  groupId?: string | null
  organizerId: string
}

export class TestDatabase {
  private testUsers: TestUser[] = []
  private testGroups: TestGroup[] = []
  private testEvents: TestEvent[] = []
  private testMembershipTiers: Array<{ id: string }> = []
  private testGroupMembers: Array<{ groupId: string; userId: string }> = []
  private testCoupons: Array<{ id: string }> = []

  async createTestUser(data: Partial<TestUser> = {}): Promise<TestUser> {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const user = await prisma.user.create({
      data: {
        name: data.name || `Test User ${unique}`,
        email: data.email || `test_${unique}@example.com`,
      } as any,
    })
    this.testUsers.push(user as any)
    return user as any
  }

  async createTestGroup(data: Partial<TestGroup> = {}): Promise<TestGroup> {
    const owner = data.ownerId ? { id: data.ownerId } : await this.createTestUser()
    const group = await prisma.group.create({
      data: {
        name: data.name || `Test Group ${Date.now()}`,
        isPrivate: data.isPrivate ?? false,
        sport: 'test-sport',
        ownerId: owner.id,
        // ensure owner appears as member too for membership checks
        members: { connect: [{ id: owner.id }] },
        ...data,
      } as any,
    })
    this.testGroups.push(group as any)
    return group as any
  }

  async createTestEvent(data: Partial<TestEvent> = {}): Promise<TestEvent> {
    const organizer = data.organizerId ? { id: data.organizerId } : await this.createTestUser()
    const group = data.groupId ? { id: data.groupId } : await this.createTestGroup({ ownerId: organizer.id })
    const event = await prisma.event.create({
      data: {
        title: data.title || `Test Event ${Date.now()}`,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        organizerId: organizer.id,
        groupId: group.id,
        ...data,
      } as any,
    })
    this.testEvents.push(event as any)
    return event as any
  }

  async createTestMembershipTier(
    groupId: string,
    overrides: Partial<{
      name: string
      description: string | null
      benefits: string[]
      priceCents: number
      currency: string
      billingPeriod: MembershipBillingPeriod
      isDefault: boolean
      stripeProductId: string | null
      stripePriceId: string | null
    }> = {},
  ) {
    const tier = await prisma.groupMembershipTier.create({
      data: {
        groupId,
        name: overrides.name || `Test Tier ${Date.now()}`,
        description: overrides.description ?? null,
        benefits: overrides.benefits ?? ['Test benefit'],
        priceCents: overrides.priceCents ?? 1500,
        currency: overrides.currency ?? 'EUR',
        billingPeriod: overrides.billingPeriod ?? ('month' as MembershipBillingPeriod),
        isDefault: overrides.isDefault ?? false,
        stripeProductId: overrides.stripeProductId ?? null,
        stripePriceId: overrides.stripePriceId ?? null,
      },
    })

    this.testMembershipTiers.push({ id: tier.id })
    return tier
  }

  async createTestCoupon(
    groupId: string,
    overrides: Partial<{
      code: string
      discountType: MembershipDiscountType
      percentageOff: number
      amountOffCents: number
      currency: string
      maxRedemptions: number | null
      startsAt: Date | null
      endsAt: Date | null
      isActive: boolean
      stripeCouponId: string | null
      stripePromotionCodeId: string | null
    }> = {},
  ) {
    const discountType = overrides.discountType ?? ('percentage' as MembershipDiscountType)
    const coupon = await prisma.groupMembershipCoupon.create({
      data: {
        groupId,
        code: overrides.code ?? `COUPON${Date.now()}`,
        discountType,
        description: null,
        percentageOff:
          discountType === 'percentage'
            ? overrides.percentageOff ?? 10
            : null,
        amountOffCents:
          discountType === 'fixed_amount'
            ? overrides.amountOffCents ?? 500
            : null,
        currency:
          discountType === 'fixed_amount'
            ? (overrides.currency ?? 'EUR').toUpperCase()
            : null,
        maxRedemptions: overrides.maxRedemptions ?? null,
        startsAt: overrides.startsAt ?? null,
        endsAt: overrides.endsAt ?? null,
        isActive: overrides.isActive ?? true,
        stripeCouponId: overrides.stripeCouponId ?? null,
        stripePromotionCodeId: overrides.stripePromotionCodeId ?? null,
      },
    })

    this.testCoupons.push({ id: coupon.id })
    return coupon
  }

  async createTestGroupMember(groupId: string, userId: string): Promise<void> {
    // connect via status
    await prisma.groupMemberStatus.create({
      data: { groupId, userId, status: 'active', joinedAt: new Date() },
    })
    // also connect via members relation to satisfy queries using relation
    await prisma.group.update({
      where: { id: groupId },
      data: { members: { connect: { id: userId } } },
    })
    this.testGroupMembers.push({ groupId, userId })
  }

  async cleanup(): Promise<void> {
    const userIds = this.testUsers.map((user) => user.id)
    const groupIds = this.testGroups.map((group) => group.id)

    if (groupIds.length > 0) {
      try {
        await prisma.groupRevenueEntry.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}

      try {
        await prisma.groupPaymentDispute.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}

      try {
        await prisma.groupPaymentRefund.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}

      try {
        await prisma.groupPayout.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}

      try {
        await prisma.groupPayoutSchedule.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}

      try {
        await prisma.groupInvite.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}
      try {
        await prisma.groupMemberStatus.deleteMany({ where: { groupId: { in: groupIds } } })
      } catch {}
    }

    if (userIds.length > 0) {
      try {
        await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
      } catch {}
    }

    for (const membership of this.testGroupMembers) {
      try {
        await prisma.group.update({
          where: { id: membership.groupId },
          data: { members: { disconnect: { id: membership.userId } } },
        })
      } catch {}
    }

    if (this.testMembershipTiers.length > 0) {
      try {
        await prisma.groupMembershipTier.deleteMany({
          where: { id: { in: this.testMembershipTiers.map((tier) => tier.id) } },
        })
      } catch {}
    }

    if (this.testCoupons.length > 0) {
      try {
        await prisma.groupMembershipCoupon.deleteMany({
          where: { id: { in: this.testCoupons.map((coupon) => coupon.id) } },
        })
      } catch {}
    }

    for (const event of this.testEvents) {
      try {
        await prisma.event.delete({ where: { id: event.id } })
      } catch {}
    }
    for (const group of this.testGroups) {
      try {
        await prisma.group.delete({ where: { id: group.id } })
      } catch {}
    }
    for (const user of this.testUsers) {
      try {
        await prisma.user.delete({ where: { id: user.id } })
      } catch {}
    }
    this.testUsers = []
    this.testGroups = []
    this.testEvents = []
    this.testMembershipTiers = []
    this.testGroupMembers = []
    this.testCoupons = []
  }

  async reset(): Promise<void> { await this.cleanup() }
}

export const testDb = new TestDatabase()

beforeAll(async () => { await prisma.$connect() })

afterAll(async () => { await testDb.cleanup(); await prisma.$disconnect() })

afterEach(async () => { await testDb.cleanup() }) 
