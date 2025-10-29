/**
 * API route tests for events
 */
import { NextRequest } from 'next/server';
import { testDb } from '@/lib/test-utils/database';
import { createMockSession } from '@/lib/test-utils';
import { GET, POST } from '@/app/api/events/route';
import { GET as getEventDetail, PUT, DELETE } from '@/app/api/events/[id]/route';
import { getBaseUrl } from '../utils/test-utils';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const { getServerSession } = require('next-auth');

describe('Events API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('should return events list for authenticated users', async () => {
      const user = await testDb.createTestUser();
      const session = createMockSession(user);

      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter events by location', async () => {
      const user = await testDb.createTestUser();
      const session = createMockSession(user);

      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events?location=Berlin`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter events by sport', async () => {
      const user = await testDb.createTestUser();
      const session = createMockSession(user);

      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events?sport=running`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/events', () => {
    it('should create event for authenticated users', async () => {
      const user = await testDb.createTestUser();
      const session = createMockSession(user);

      getServerSession.mockResolvedValue(session);

      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        sport: 'running',
        location: 'Berlin',
      };

      const request = new NextRequest(`${getBaseUrl()}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('Test Event');
      expect(data.organizerId).toBe(user.id);
    });

    it('should reject event creation for unauthenticated users', async () => {
      getServerSession.mockResolvedValue(null);

      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        sport: 'running',
      };

      const request = new NextRequest(`${getBaseUrl()}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/events/[id]', () => {
    it('should return event details for public events', async () => {
      const organizer = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
        isPrivate: false,
      });

      getServerSession.mockResolvedValue(null); // Unauthenticated

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`);
      const response = await getEventDetail(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(event.id);
      expect(data.title).toBe(event.title);
    });

    it('should return event details for event owners', async () => {
      const organizer = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
        isPrivate: true,
      });

      const session = createMockSession(organizer);
      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`);
      const response = await getEventDetail(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(event.id);
      expect(data.isPrivate).toBe(true);
    });

    it('should return 404 for non-existent events', async () => {
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest(`${getBaseUrl()}/api/events/non-existent-id`);
      const response = await getEventDetail(request, {
        params: Promise.resolve({ id: 'non-existent-id' })
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/events/[id]', () => {
    it('should update event for owners', async () => {
      const organizer = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      });

      const session = createMockSession(organizer);
      getServerSession.mockResolvedValue(session);

      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description',
      };

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe('Updated Event Title');
    });

    it('should reject update for non-owners', async () => {
      const organizer = await testDb.createTestUser();
      const otherUser = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      });

      const session = createMockSession(otherUser);
      getServerSession.mockResolvedValue(session);

      const updateData = {
        title: 'Hacked Title',
      };

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/events/[id]', () => {
    it('should delete event for owners', async () => {
      const organizer = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      });

      const session = createMockSession(organizer);
      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(200);
    });

    it('should reject delete for non-owners', async () => {
      const organizer = await testDb.createTestUser();
      const otherUser = await testDb.createTestUser();
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      });

      const session = createMockSession(otherUser);
      getServerSession.mockResolvedValue(session);

      const request = new NextRequest(`${getBaseUrl()}/api/events/${event.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: event.id })
      });

      expect(response.status).toBe(403);
    });
  });
});

