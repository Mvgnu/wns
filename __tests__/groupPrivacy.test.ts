/**
 * Group Privacy and Events Tests
 * 
 * This test suite validates the functionality of private groups,
 * event creation in private groups, and notification systems.
 */

import { PrismaClient } from '@prisma/client';
import { getMockSession } from '../lib/test-utils';

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
    id: 'test-private-group',
    name: 'Test Private Group',
    sport: 'tennis',
    isPrivate: true,
    ownerId: testUsers.owner.id
  };

  // Setup before all tests
  beforeAll(async () => {
    // Create test users
    await Promise.all([
      prisma.user.upsert({
        where: { id: testUsers.owner.id },
        update: {},
        create: testUsers.owner
      }),
      prisma.user.upsert({
        where: { id: testUsers.member.id },
        update: {},
        create: testUsers.member
      }),
      prisma.user.upsert({
        where: { id: testUsers.nonMember.id },
        update: {},
        create: testUsers.nonMember
      })
    ]);

    // Create a private group
    await prisma.group.upsert({
      where: { id: privateGroup.id },
      update: {},
      create: privateGroup
    });

    // Add member to the group
    await prisma.groupMember.create({
      data: {
        groupId: privateGroup.id,
        userId: testUsers.member.id,
        role: 'MEMBER'
      }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Delete test data
    await prisma.notification.deleteMany({
      where: {
        userId: {
          in: [testUsers.owner.id, testUsers.member.id, testUsers.nonMember.id]
        }
      }
    });
    
    await prisma.event.deleteMany({
      where: {
        groupId: privateGroup.id
      }
    });
    
    await prisma.groupMember.deleteMany({
      where: {
        groupId: privateGroup.id
      }
    });
    
    await prisma.group.delete({
      where: {
        id: privateGroup.id
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testUsers.owner.id, testUsers.member.id, testUsers.nonMember.id]
        }
      }
    });

    // Close database connection
    await prisma.$disconnect();
  });

  describe('Group Visibility Tests', () => {
    test('Private group is visible to the owner', async () => {
      const mockSession = getMockSession(testUsers.owner);
      
      // Mock API request to get group
      const response = await fetch(`/api/groups/${privateGroup.id}`, {
        headers: {
          'Cookie': `next-auth.session-token=${mockSession.token}`
        }
      });
      
      expect(response.status).toBe(200);
      const group = await response.json();
      expect(group.id).toBe(privateGroup.id);
      expect(group.isPrivate).toBe(true);
    });

    test('Private group is visible to members', async () => {
      const mockSession = getMockSession(testUsers.member);
      
      // Mock API request to get group
      const response = await fetch(`/api/groups/${privateGroup.id}`, {
        headers: {
          'Cookie': `next-auth.session-token=${mockSession.token}`
        }
      });
      
      expect(response.status).toBe(200);
      const group = await response.json();
      expect(group.id).toBe(privateGroup.id);
    });

    test('Private group is NOT visible to non-members', async () => {
      const mockSession = getMockSession(testUsers.nonMember);
      
      // Mock API request to get group
      const response = await fetch(`/api/groups/${privateGroup.id}`, {
        headers: {
          'Cookie': `next-auth.session-token=${mockSession.token}`
        }
      });
      
      // Should return 403 Forbidden
      expect(response.status).toBe(403);
    });
  });

  describe('Event Creation in Private Groups Tests', () => {
    const testEvent = {
      title: 'Test Event in Private Group',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      groupId: privateGroup.id
    };

    test('Owner can create an event in a private group', async () => {
      const mockSession = getMockSession(testUsers.owner);
      
      // Mock API request to create event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${mockSession.token}`
        },
        body: JSON.stringify(testEvent)
      });
      
      expect(response.status).toBe(201);
      const event = await response.json();
      expect(event.title).toBe(testEvent.title);
      expect(event.groupId).toBe(privateGroup.id);
      
      // Save event ID for other tests
      testEvent.id = event.id;
    });

    test('Member can create an event in a private group', async () => {
      const mockSession = getMockSession(testUsers.member);
      
      // Mock API request to create event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${mockSession.token}`
        },
        body: JSON.stringify({
          title: 'Member Created Event',
          startTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          groupId: privateGroup.id
        })
      });
      
      expect(response.status).toBe(201);
    });

    test('Non-member CANNOT create an event in a private group', async () => {
      const mockSession = getMockSession(testUsers.nonMember);
      
      // Mock API request to create event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${mockSession.token}`
        },
        body: JSON.stringify({
          title: 'Unauthorized Event',
          startTime: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
          groupId: privateGroup.id
        })
      });
      
      // Should fail
      expect(response.status).toBe(403);
    });
  });

  describe('Group Invitation and Notification Tests', () => {
    test('Group owner can invite users', async () => {
      const mockSession = getMockSession(testUsers.owner);
      
      // Mock API request to send invitation
      const response = await fetch(`/api/groups/${privateGroup.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${mockSession.token}`
        },
        body: JSON.stringify({
          email: testUsers.nonMember.email
        })
      });
      
      expect(response.status).toBe(200);
      
      // Verify notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUsers.nonMember.id,
          type: 'GROUP_INVITATION'
        }
      });
      
      expect(notification).not.toBeNull();
      expect(notification?.data).toContain(privateGroup.id);
    });

    test('Group member gets notification for new event', async () => {
      // Create an event as the owner
      const mockSession = getMockSession(testUsers.owner);
      
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${mockSession.token}`
        },
        body: JSON.stringify({
          title: 'Notification Test Event',
          startTime: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
          groupId: privateGroup.id
        })
      });
      
      expect(eventResponse.status).toBe(201);
      
      // Check that member received a notification
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUsers.member.id,
          type: 'NEW_GROUP_EVENT'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      expect(notification).not.toBeNull();
      expect(notification?.data).toContain('Notification Test Event');
    });
  });
}); 