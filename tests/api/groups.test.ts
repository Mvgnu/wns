/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import * as NextAuth from 'next-auth'
import { testDb } from '../utils/database'
import { createMockSession, createMockRequest } from '../utils'
import { GET, PUT, DELETE } from '@/app/api/groups/[id]/route'
import { POST } from '@/app/api/groups/route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock authOptions to avoid ESM issues from @auth/prisma-adapter
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Groups API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/groups/[id]', () => {
    it('should return a public group for unauthenticated users', async () => {
      const owner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
        isPrivate: false,
      })

      const request = createMockRequest(`/api/groups/${group.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(group.id)
      expect(data.name).toBe(group.name)
      expect(data.isPrivate).toBe(false)
    })

    it('should return a private group for the owner', async () => {
      const owner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
        isPrivate: true,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const request = createMockRequest(`/api/groups/${group.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(group.id)
      expect(data.isPrivate).toBe(true)
    })

    it('should return 403 for private group access by non-members', async () => {
      const owner = await testDb.createTestUser()
      const nonMember = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
        isPrivate: true,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(nonMember))

      const request = createMockRequest(`/api/groups/${group.id}`)
      const response = await GET(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent group', async () => {
      const request = createMockRequest('/api/groups/non-existent-id')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-id' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/groups', () => {
    it('should create a new group for authenticated user', async () => {
      const user = await testDb.createTestUser()
      getServerSessionMock.mockResolvedValue(createMockSession(user))

      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        sport: 'basketball',
        isPrivate: false,
      }

      const request = createMockRequest('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.name).toBe(groupData.name)
      expect(data.description).toBe(groupData.description)
      expect(data.sport).toBe(groupData.sport)
      expect(data.ownerId).toBe(user.id)
    })

    it('should return 401 for unauthenticated users', async () => {
      getServerSessionMock.mockResolvedValue(null)

      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        sport: 'basketball',
      }

      const request = createMockRequest('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      const response = await POST(request, { params: Promise.resolve({}) })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/groups/[id]', () => {
    it('should update group for owner', async () => {
      const owner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
        isPrivate: false,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description',
      }

      const request = createMockRequest(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.name).toBe(updateData.name)
      expect(data.description).toBe(updateData.description)
    })

    it('should return 403 for non-owner updates', async () => {
      const owner = await testDb.createTestUser()
      const nonOwner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(nonOwner))

      const updateData = { name: 'Updated Name' }

      const request = createMockRequest(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/groups/[id]', () => {
    it('should delete group for owner', async () => {
      const owner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(owner))

      const request = createMockRequest(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(200)
    })

    it('should return 403 for non-owner deletion', async () => {
      const owner = await testDb.createTestUser()
      const nonOwner = await testDb.createTestUser()
      const group = await testDb.createTestGroup({
        ownerId: owner.id,
      })

      getServerSessionMock.mockResolvedValue(createMockSession(nonOwner))

      const request = createMockRequest(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: group.id }) })

      expect(response.status).toBe(403)
    })
  })
}) 
