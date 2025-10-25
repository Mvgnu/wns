import { PrismaClient } from '@prisma/client'

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
  }

  async cleanup(): Promise<void> {
    for (const event of this.testEvents) { try { await prisma.event.delete({ where: { id: event.id } }) } catch {} }
    for (const group of this.testGroups) { try { await prisma.group.delete({ where: { id: group.id } }) } catch {} }
    for (const user of this.testUsers) { try { await prisma.user.delete({ where: { id: user.id } }) } catch {} }
    this.testUsers = []
    this.testGroups = []
    this.testEvents = []
  }

  async reset(): Promise<void> { await this.cleanup() }
}

export const testDb = new TestDatabase()

beforeAll(async () => { await prisma.$connect() })

afterAll(async () => { await testDb.cleanup(); await prisma.$disconnect() })

afterEach(async () => { await testDb.cleanup() }) 