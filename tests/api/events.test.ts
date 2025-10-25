/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { testDb } from '@/lib/test-utils/database'
import { createMockSession } from '@/lib/test-utils'
import { GET, PUT, DELETE } from '@/app/api/events/[id]/route'
import { POST } from '@/app/api/events/route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock authOptions to avoid ESM issues from @auth/prisma-adapter
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const { getServerSession } = require('next-auth')

describe('Events API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/events/[id]', () => {
    it('should return a public event for unauthenticated users', async () => {
      const organizer = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: organizer.id,
        isPrivate: false,
      })
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
        groupId: group.id,
      })

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(event.id)
      expect(data.title).toBe(event.title)
    })

    it('should return a private group event for group members', async () => {
      const organizer = await testDb.createTestUser()
      const member = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: organizer.id,
        isPrivate: true,
      })
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
        groupId: group.id,
      })

      // Add member to group
      await testDb.createTestGroupMember(group.id, member.id)

      getServerSession.mockResolvedValue(createMockSession(member))

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(event.id)
    })

    it('should return 403 for private group event access by non-members', async () => {
      const organizer = await testDb.createTestUser()
      const nonMember = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: organizer.id,
        isPrivate: true,
      })
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
        groupId: group.id,
      })

      getServerSession.mockResolvedValue(createMockSession(nonMember))

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent event', async () => {
      const request = new NextRequest('http://localhost:3000/api/events/non-existent-id')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-id' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/events', () => {
    it('should create a new event for authenticated user', async () => {
      const user = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: user.id,
        isPrivate: false,
      })

      getServerSession.mockResolvedValue(createMockSession(user))

      const eventData = {
        title: 'Test Event',
        description: 'A test event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        groupId: group.id,
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.title).toBe(eventData.title)
      expect(data.description).toBe(eventData.description)
      expect(data.organizerId).toBe(user.id)
    })

    it('should return 401 for unauthenticated users', async () => {
      getServerSession.mockResolvedValue(null)

      const eventData = {
        title: 'Test Event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(401)
    })

    it('should return 403 for creating event in private group as non-member', async () => {
      const organizer = await testDb.createTestUser()
      const nonMember = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: organizer.id,
        isPrivate: true,
      })

      getServerSession.mockResolvedValue(createMockSession(nonMember))

      const eventData = {
        title: 'Test Event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId: group.id,
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/events (pricing)', () => {
    it('creates a paid event with pricing fields', async () => {
      const user = await testDb.createTestUser()
      const group = await testDb.createTestGroup({ ownerId: user.id, isPrivate: false })

      getServerSession.mockResolvedValue(createMockSession(user))

      const eventData = {
        title: 'Paid Event',
        description: 'A paid test event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        groupId: group.id,
        isPaid: true,
        price: 29.99,
        priceCurrency: 'EUR',
        priceDescription: 'Includes equipment',
        maxAttendees: 30,
      }

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.isPaid).toBe(true)
      expect(data.price).toBeCloseTo(29.99)
      expect(data.priceCurrency).toBe('EUR')
      expect(data.priceDescription).toBe('Includes equipment')
      expect(data.maxAttendees).toBe(30)
    })
  })

  describe('PUT /api/events/[id]', () => {
    it('should update event for organizer', async () => {
      const organizer = await testDb.createTestUser()
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      })

      getServerSession.mockResolvedValue(createMockSession(organizer))

      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description',
      }

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.title).toBe(updateData.title)
      expect(data.description).toBe(updateData.description)
    })

    it('should return 403 for non-organizer updates', async () => {
      const organizer = await testDb.createTestUser()
      const nonOrganizer = await testDb.createTestUser()
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      })

      getServerSession.mockResolvedValue(createMockSession(nonOrganizer))

      const updateData = { title: 'Updated Title' }

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/events/[id]', () => {
    it('should delete event for organizer', async () => {
      const organizer = await testDb.createTestUser()
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      })

      getServerSession.mockResolvedValue(createMockSession(organizer))

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(200)
    })

    it('should return 403 for non-organizer deletion', async () => {
      const organizer = await testDb.createTestUser()
      const nonOrganizer = await testDb.createTestUser()
      const event = await testDb.createTestEvent({
        organizerId: organizer.id,
      })

      getServerSession.mockResolvedValue(createMockSession(nonOrganizer))

      const request = new NextRequest(`http://localhost:3000/api/events/${event.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: event.id }) })

      expect(response.status).toBe(403)
    })
  })
}) 