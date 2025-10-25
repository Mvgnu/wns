/**
 * @jest-environment node
 */
/**
 * Group Privacy and Events Tests
 * 
 * This test suite validates the functionality of private groups,
 * event creation in private groups, and notification systems.
 */

import { PrismaClient } from '@prisma/client';
import { createMockSession } from '../lib/test-utils';
import { NextRequest } from 'next/server'

// Mocks
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/notificationService', () => ({ sendNotificationToUser: jest.fn() }))

import { GET as GET_GROUP } from '@/app/api/groups/[id]/route'
import { POST as POST_EVENT } from '@/app/api/events/route'
import { POST as POST_INVITE } from '@/app/api/groups/invites/route'
import { sendNotificationToUser } from '@/lib/notificationService'

const { getServerSession } = require('next-auth')

// Initialize a new Prisma Client for tests
const prisma = new PrismaClient();

describe('Group Privacy Tests', () => {
  // Test users
  const testUsers = {
    owner: {
      id: 'user-owner',
      name: 'Group Owner',
      email: 'owner@example.com'
    },
    member: {
      id: 'user-member',
      name: 'Group Member',
      email: 'member@example.com'
    },
    nonMember: {
      id: 'user-nonmember',
      name: 'Non-Member',
      email: 'nonmember@example.com'
    }
  };

  // Test group data
  const privateGroup = {
    id: `test-private-group-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name: 'Test Private Group',
    sport: 'tennis',
    isPrivate: true,
    ownerId: testUsers.owner.id
  } as any;

  // Setup before all tests
  beforeAll(async () => {
    // Create test users
    await Promise.all([
      prisma.user.upsert({ where: { id: testUsers.owner.id }, update: {}, create: testUsers.owner }),
      prisma.user.upsert({ where: { id: testUsers.member.id }, update: {}, create: testUsers.member }),
      prisma.user.upsert({ where: { id: testUsers.nonMember.id }, update: {}, create: testUsers.nonMember }),
    ]);

    // Create private group
    await prisma.group.upsert({ where: { id: privateGroup.id }, update: {}, create: privateGroup });

    // Add member to the group via status table and relation
    await prisma.groupMemberStatus.create({ data: { groupId: privateGroup.id, userId: testUsers.member.id, status: 'active', joinedAt: new Date() } });
    await prisma.group.update({ where: { id: privateGroup.id }, data: { members: { connect: { id: testUsers.member.id } } } });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: [testUsers.owner.id, testUsers.member.id, testUsers.nonMember.id] } } });
    await prisma.event.deleteMany({ where: { groupId: privateGroup.id } });
    await prisma.groupMemberStatus.deleteMany({ where: { groupId: privateGroup.id } });
    await prisma.groupInvite.deleteMany({ where: { groupId: privateGroup.id } });
    await prisma.group.update({ where: { id: privateGroup.id }, data: { members: { set: [] } } }).catch(() => {});
    await prisma.group.delete({ where: { id: privateGroup.id } });
    await prisma.user.deleteMany({ where: { id: { in: [testUsers.owner.id, testUsers.member.id, testUsers.nonMember.id] } } });
    await prisma.$disconnect();
  });

  describe('Group Visibility Tests', () => {
    test('Private group is visible to the owner', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.owner))
      const req = new NextRequest(`http://localhost:3000/api/groups/${privateGroup.id}`)
      const res = await GET_GROUP(req, { params: Promise.resolve({ id: privateGroup.id }) })
      expect(res.status).toBe(200)
      const group = await res.json()
      expect(group.id).toBe(privateGroup.id)
      expect(group.isPrivate).toBe(true)
    });

    test('Private group is visible to members', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.member))
      const req = new NextRequest(`http://localhost:3000/api/groups/${privateGroup.id}`)
      const res = await GET_GROUP(req, { params: Promise.resolve({ id: privateGroup.id }) })
      expect(res.status).toBe(200)
      const group = await res.json()
      expect(group.id).toBe(privateGroup.id)
    });

    test('Private group is NOT visible to non-members', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.nonMember))
      const req = new NextRequest(`http://localhost:3000/api/groups/${privateGroup.id}`)
      const res = await GET_GROUP(req, { params: Promise.resolve({ id: privateGroup.id }) })
      expect(res.status).toBe(403)
    });
  });

  describe('Event Creation in Private Groups Tests', () => {
    const testEvent: any = {
      title: 'Test Event in Private Group',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      groupId: privateGroup.id
    };

    test('Owner can create an event in a private group', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.owner))
      const req = new NextRequest('http://localhost:3000/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testEvent) })
      const res = await POST_EVENT(req, { params: Promise.resolve({}) } as any)
      expect(res.status).toBe(201)
      const event = await res.json()
      expect(event.title).toBe(testEvent.title)
      expect(event.groupId).toBe(privateGroup.id)
      testEvent.id = event.id
    });

    test('Member can create an event in a private group', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.member))
      const req = new NextRequest('http://localhost:3000/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Member Created Event', startTime: new Date(Date.now() + 172800000).toISOString(), groupId: privateGroup.id }) })
      const res = await POST_EVENT(req, { params: Promise.resolve({}) } as any)
      expect(res.status).toBe(201)
    });

    test('Non-member CANNOT create an event in a private group', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.nonMember))
      const req = new NextRequest('http://localhost:3000/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Unauthorized Event', startTime: new Date(Date.now() + 259200000).toISOString(), groupId: privateGroup.id }) })
      const res = await POST_EVENT(req, { params: Promise.resolve({}) } as any)
      expect(res.status).toBe(403)
    });
  });

  describe('Group Invitation and Notification Tests', () => {
    test('Group owner can invite users', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.owner))
      const req = new NextRequest('http://localhost:3000/api/groups/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId: privateGroup.id, invitedUserId: testUsers.nonMember.id }) })
      const res = await POST_INVITE(req)
      expect(res.status).toBe(201)

      // Verify notification was created
      const notification = await prisma.notification.findFirst({ where: { userId: testUsers.nonMember.id, type: 'GROUP_INVITE' } })
      expect(notification).not.toBeNull();
      expect(notification?.linkUrl).toContain(privateGroup.id);
    });

    test('Group member gets notification for new event', async () => {
      getServerSession.mockResolvedValue(createMockSession(testUsers.owner))
      const req = new NextRequest('http://localhost:3000/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Notification Test Event', startTime: new Date(Date.now() + 345600000).toISOString(), groupId: privateGroup.id }) })
      const res = await POST_EVENT(req, { params: Promise.resolve({}) } as any)
      expect(res.status).toBe(201)

      // Assert realtime notification dispatched to member
      expect((sendNotificationToUser as jest.Mock).mock.calls.some(([uid, payload]) => uid === testUsers.member.id && payload?.type === 'event_created' && String(payload?.message).includes('Notification Test Event'))).toBe(true)
    });
  });
}); 