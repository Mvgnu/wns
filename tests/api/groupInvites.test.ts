/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as NextAuth from 'next-auth'
import { testDb } from '@/lib/test-utils/database'
import { createMockSession } from '@/lib/test-utils'
import { GET, POST, PUT } from '@/app/api/groups/invites/route'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
// Mock authOptions to avoid ESM issues
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Group Invites API', () => {
        beforeEach(() => { vi.clearAllMocks() })

	it('returns 401 for unauthorized GET', async () => {
                getServerSessionMock.mockResolvedValue(null)
		const req = new NextRequest('http://localhost:3000/api/groups/invites')
		const res = await GET(req)
		expect(res.status).toBe(401)
	})

	it('member can create invite; invited user sees received; inviter sees sent; invited can accept', async () => {
		// Setup users and group
		const inviter = await testDb.createTestUser()
		const invited = await testDb.createTestUser()
		const group = await testDb.createTestGroup({ ownerId: inviter.id, isPrivate: true })

		// Ensure inviter is in members (owner already connected by helper)
                getServerSessionMock.mockResolvedValue(createMockSession(inviter))

		// Create invite
		const postReq = new NextRequest('http://localhost:3000/api/groups/invites', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ groupId: group.id, invitedUserId: invited.id })
		})
		const postRes = await POST(postReq)
		expect(postRes.status).toBe(201)
		const invite = await postRes.json()
		expect(invite.groupId).toBe(group.id)
		expect(invite.invitedUserId).toBe(invited.id)

		// Invited user views received invites
                getServerSessionMock.mockResolvedValue(createMockSession(invited))
		const recvReq = new NextRequest(`http://localhost:3000/api/groups/invites?type=received`)
		const recvRes = await GET(recvReq)
		expect(recvRes.status).toBe(200)
		const recvData = await recvRes.json()
		expect(Array.isArray(recvData.invites)).toBe(true)
		expect(recvData.invites.some((i: any) => i.groupId === group.id && i.invitedUserId === invited.id)).toBe(true)

		// Inviter views sent invites
                getServerSessionMock.mockResolvedValue(createMockSession(inviter))
		const sentReq = new NextRequest(`http://localhost:3000/api/groups/invites?type=sent`)
		const sentRes = await GET(sentReq)
		expect(sentRes.status).toBe(200)
		const sentData = await sentRes.json()
		expect(sentData.invites.some((i: any) => i.groupId === group.id && i.invitedUserId === invited.id)).toBe(true)

		// Invited accepts invite
                getServerSessionMock.mockResolvedValue(createMockSession(invited))
		const putReq = new NextRequest('http://localhost:3000/api/groups/invites', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ inviteId: invite.id, status: 'accepted' })
		})
		const putRes = await PUT(putReq)
		expect(putRes.status).toBe(200)
		const updated = await putRes.json()
		expect(updated.status).toBe('accepted')
	})
}) 
