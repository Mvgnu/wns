/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as NextAuth from 'next-auth'
import prisma from '@/lib/prisma'
import { testDb } from '@/lib/test-utils/database'
import { createMockSession } from '@/lib/test-utils'
import { GET as GET_GROUP } from '@/app/api/groups/[id]/route'
import { POST as POST_EVENT } from '@/app/api/events/route'
import { POST as POST_INVITE } from '@/app/api/groups/invites/route'
import { sendNotificationToUser } from '@/lib/notificationService'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/notificationService', () => ({
  sendNotificationToUser: vi.fn(),
}))

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)
const sendNotificationToUserMock = vi.mocked(sendNotificationToUser)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

const createGroupWithMembers = async () => {
  const owner = await testDb.createTestUser()
  const member = await testDb.createTestUser()
  const nonMember = await testDb.createTestUser()
  const group = await testDb.createTestGroup({ ownerId: owner.id, isPrivate: true })
  await testDb.createTestGroupMember(group.id, member.id)

  return { owner, member, nonMember, group }
}

describeIfDatabase('Group Privacy API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Group visibility', () => {
    it('allows the owner to view their private group', async () => {
      const { owner, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const request = new NextRequest(`http://localhost:3000/api/groups/${group.id}`)
      const response = await GET_GROUP(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.id).toBe(group.id)
      expect(payload.isPrivate).toBe(true)
    })

    it('allows members to view a private group', async () => {
      const { member, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(member))

      const request = new NextRequest(`http://localhost:3000/api/groups/${group.id}`)
      const response = await GET_GROUP(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.id).toBe(group.id)
    })

    it('prevents non-members from viewing a private group', async () => {
      const { nonMember, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(nonMember))

      const request = new NextRequest(`http://localhost:3000/api/groups/${group.id}`)
      const response = await GET_GROUP(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(403)
    })
  })

  describe('Event creation in private groups', () => {
    it('allows the owner to create an event', async () => {
      const { owner, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const body = JSON.stringify({
        title: 'Owner created event',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        groupId: group.id,
      })

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const response = await POST_EVENT(request, { params: Promise.resolve({}) } as any)
      expect(response.status).toBe(201)

      const event = await response.json()
      expect(event.groupId).toBe(group.id)
      expect(event.title).toContain('Owner created event')
    })

    it('allows members to create an event', async () => {
      const { member, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(member))

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Member created event',
          startTime: new Date(Date.now() + 2 * 86400000).toISOString(),
          groupId: group.id,
        }),
      })

      const response = await POST_EVENT(request, { params: Promise.resolve({}) } as any)
      expect(response.status).toBe(201)
    })

    it('blocks non-members from creating an event', async () => {
      const { nonMember, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(nonMember))

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized event',
          startTime: new Date(Date.now() + 3 * 86400000).toISOString(),
          groupId: group.id,
        }),
      })

      const response = await POST_EVENT(request, { params: Promise.resolve({}) } as any)
      expect(response.status).toBe(403)
    })
  })

  describe('Invitations and notifications', () => {
    it('creates a notification when the owner invites a user', async () => {
      const { owner, nonMember, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const request = new NextRequest('http://localhost:3000/api/groups/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, invitedUserId: nonMember.id }),
      })

      const response = await POST_INVITE(request)
      expect(response.status).toBe(201)

      const notification = await prisma.notification.findFirst({
        where: { userId: nonMember.id, type: 'GROUP_INVITE' },
      })
      expect(notification).not.toBeNull()
      expect(notification?.linkUrl).toContain(group.id)
    })

    it('sends realtime notifications for new events', async () => {
      const { owner, member, group } = await createGroupWithMembers()

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Notification Test Event',
          startTime: new Date(Date.now() + 4 * 86400000).toISOString(),
          groupId: group.id,
        }),
      })

      const response = await POST_EVENT(request, { params: Promise.resolve({}) } as any)
      expect(response.status).toBe(201)

      expect(
        sendNotificationToUserMock.mock.calls.some(([userId, payload]) => {
          return (
            userId === member.id &&
            payload?.type === 'event_created' &&
            String(payload?.message).includes('Notification Test Event')
          )
        }),
      ).toBe(true)
    })
  })
})
