/**
 * Test database utilities for creating test data
 */
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

export class TestDatabase {
  constructor() {
    // Database will be cleared before each test suite
  }

  async clearDatabase() {
    try {
      // Clear all data in reverse dependency order
      await prisma.eventPurchase.deleteMany({});
      await prisma.discountCode.deleteMany({});
      await prisma.pricingTier.deleteMany({});
      await prisma.eventOrganizer.deleteMany({});
      await prisma.eventReminder.deleteMany({});
      await prisma.participationResponse.deleteMany({});
      await prisma.eventInstanceResponse.deleteMany({});
      await prisma.emailNotificationLog.deleteMany({});
      await prisma.recommendationFeedback.deleteMany({});
      await prisma.placeClaim.deleteMany({});
      await prisma.placeStaff.deleteMany({});
      await prisma.placeAmenity.deleteMany({});
      await prisma.locationReview.deleteMany({});
      await prisma.locationVideo.deleteMany({});
      await prisma.locationPrice.deleteMany({});
      await prisma.clubMemberRole.deleteMany({});
      await prisma.clubRole.deleteMany({});
      await prisma.clubSport.deleteMany({});
      await prisma.clubLocation.deleteMany({});
      await prisma.club.deleteMany({});
      await prisma.clubGroup.deleteMany({});
      await prisma.groupRole.deleteMany({});
      await prisma.groupMemberRole.deleteMany({});
      await prisma.groupMemberStatus.deleteMany({});
      await prisma.groupAdmin.deleteMany({});
      await prisma.groupInvite.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.notificationPreferences.deleteMany({});
      await prisma.userDeviceToken.deleteMany({});
      await prisma.feedPostLike.deleteMany({});
      await prisma.feedPostReply.deleteMany({});
      await prisma.feedPostTarget.deleteMany({});
      await prisma.feedPost.deleteMany({});
      await prisma.like.deleteMany({});
      await prisma.comment.deleteMany({});
      await prisma.post.deleteMany({});
      await prisma.event.deleteMany({});
      await prisma.group.deleteMany({});
      await prisma.location.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  async createTestUser(overrides: any = {}) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    return await prisma.user.create({
      data: {
        name: overrides.name || 'Test User',
        email: overrides.email || `test${Date.now()}@example.com`,
        password: overrides.password || hashedPassword,
        sports: overrides.sports || ['running', 'fitness'],
        latitude: overrides.latitude || 52.5200,
        longitude: overrides.longitude || 13.4050,
        locationName: overrides.locationName || 'Berlin, Germany',
        city: overrides.city || 'Berlin',
        country: overrides.country || 'Germany',
        ...overrides,
      },
    });
  }

  async createTestGroup(overrides: any = {}) {
    const owner = overrides.ownerId
      ? await prisma.user.findUnique({ where: { id: overrides.ownerId } })
      : await this.createTestUser();

    return await prisma.group.create({
      data: {
        name: overrides.name || 'Test Group',
        description: overrides.description || 'A test group for testing',
        sport: overrides.sport || 'running',
        location: overrides.location || 'Berlin',
        locationName: overrides.locationName || 'Berlin, Germany',
        latitude: overrides.latitude || 52.5200,
        longitude: overrides.longitude || 13.4050,
        isPrivate: overrides.isPrivate || false,
        ownerId: overrides.ownerId || owner.id,
        city: overrides.city || 'Berlin',
        country: overrides.country || 'Germany',
        activityLevel: overrides.activityLevel || 'medium',
        groupTags: overrides.groupTags || ['test', 'running'],
        status: overrides.status || 'active',
        entryRules: overrides.entryRules || {
          requireApproval: false,
          allowPublicJoin: true,
        },
        settings: overrides.settings || {
          allowMemberPosts: true,
          allowMemberEvents: true,
          contentModeration: 'low',
        },
        ...overrides,
      },
    });
  }

  async createTestEvent(overrides: any = {}) {
    const organizer = overrides.organizerId
      ? await prisma.user.findUnique({ where: { id: overrides.organizerId } })
      : await this.createTestUser();

    return await prisma.event.create({
      data: {
        title: overrides.title || 'Test Event',
        description: overrides.description || 'A test event for testing',
        startTime: overrides.startTime || new Date(Date.now() + 86400000), // Tomorrow
        endTime: overrides.endTime || new Date(Date.now() + 90000000), // 1 hour later
        organizerId: overrides.organizerId || organizer.id,
        groupId: overrides.groupId || null,
        locationId: overrides.locationId || null,
        sport: overrides.sport || 'running',
        location: overrides.location || 'Berlin',
        latitude: overrides.latitude || 52.5200,
        longitude: overrides.longitude || 13.4050,
        isPaid: overrides.isPaid || false,
        price: overrides.price || null,
        priceCurrency: overrides.priceCurrency || 'EUR',
        maxAttendees: overrides.maxAttendees || null,
        joinRestriction: overrides.joinRestriction || 'everyone',
        isRecurring: overrides.isRecurring || false,
        ...overrides,
      },
    });
  }

  async createTestLocation(overrides: any = {}) {
    return await prisma.location.create({
      data: {
        name: overrides.name || 'Test Location',
        description: overrides.description || 'A test location for testing',
        sport: overrides.sport || 'running',
        latitude: overrides.latitude || 52.5200,
        longitude: overrides.longitude || 13.4050,
        address: overrides.address || 'Test Address 123',
        city: overrides.city || 'Berlin',
        state: overrides.state || 'Berlin',
        country: overrides.country || 'Germany',
        zipCode: overrides.zipCode || '10117',
        placeType: overrides.placeType || 'facility',
        detailType: overrides.detailType || 'gym',
        verified: overrides.verified || false,
        featured: overrides.featured || false,
        addedById: overrides.addedById || (await this.createTestUser()).id,
        ...overrides,
      },
    });
  }

  async createTestPost(overrides: any = {}) {
    const author = overrides.authorId
      ? await prisma.user.findUnique({ where: { id: overrides.authorId } })
      : await this.createTestUser();

    const group = overrides.groupId
      ? await prisma.group.findUnique({ where: { id: overrides.groupId } })
      : null;

    return await prisma.post.create({
      data: {
        title: overrides.title || 'Test Post',
        content: overrides.content || 'Test post content for testing purposes.',
        authorId: overrides.authorId || author.id,
        groupId: overrides.groupId || (group?.id || null),
        ...overrides,
      },
    });
  }

  async cleanup() {
    await this.clearDatabase();
  }
}

// Export a singleton instance for tests
export const testDb = new TestDatabase();

// Export a function to clear database before tests
export async function setupTestDatabase() {
  await testDb.clearDatabase();
}
