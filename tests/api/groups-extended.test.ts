/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as NextAuth from 'next-auth'
import { POST, GET } from '@/app/api/groups/route'
import { testDb } from '@/lib/test-utils/database'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
// Mock authOptions to avoid ESM issues
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const getServerSessionMock = vi.mocked(NextAuth.getServerSession)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Groups API - Extended Creation and Filters', () => {
        beforeEach(() => { vi.clearAllMocks() })

	it('creates a group with extended fields and maps sports[0] to sport', async () => {
		const owner = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: owner.id, name: owner.name } })

		const body = {
			name: 'Advanced Group',
			description: 'desc',
			image: '/uploads/groups/img.png',
			sports: ['running','cycling'],
			location: 'Berlin',
			isPrivate: true,
			groupTags: ['verein','team'],
			activityLevel: 'high',
			entryRules: { requireApproval: true },
			settings: { contentModeration: 'low' },
		}

		const req = new NextRequest('http://localhost:3000/api/groups', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		const res = await POST(req)
		expect(res.status).toBe(201)
		const data = await res.json()
		expect(data.name).toBe('Advanced Group')
		expect(data.sport).toBe('running')
		expect(data.isPrivate).toBe(true)
	})

	it('GET returns only public groups for anonymous and includes private membership for members', async () => {
		const owner = await testDb.createTestUser()
		const member = await testDb.createTestUser()
		// Create one public, one private
		const publicGroup = await testDb.createTestGroup({ ownerId: owner.id, isPrivate: false, name: 'Public G', sport: 'running' } as any)
		const privateGroup = await testDb.createTestGroup({ ownerId: owner.id, isPrivate: true, name: 'Private G', sport: 'cycling' } as any)
		// As anonymous
                getServerSessionMock.mockResolvedValue(null)
		let res = await GET(new NextRequest('http://localhost:3000/api/groups'))
		expect(res.status).toBe(200)
		let list = await res.json()
		expect(list.some((g: any) => g.name === 'Public G')).toBe(true)
		expect(list.some((g: any) => g.name === 'Private G')).toBe(false)
		// As member of private group
		await testDb.createTestGroupMember(privateGroup.id, member.id)
                getServerSessionMock.mockResolvedValue({ user: { id: member.id } })
		res = await GET(new NextRequest('http://localhost:3000/api/groups'))
		list = await res.json()
		expect(list.some((g: any) => g.name === 'Private G')).toBe(true)
	})

	it('GET filters by sport', async () => {
		const user = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: user.id } })
		await testDb.createTestGroup({ ownerId: user.id, isPrivate: false, name: 'Run G', sport: 'running' } as any)
		await testDb.createTestGroup({ ownerId: user.id, isPrivate: false, name: 'Cycle G', sport: 'cycling' } as any)
		const res = await GET(new NextRequest('http://localhost:3000/api/groups?sport=running'))
		expect(res.status).toBe(200)
		const list = await res.json()
		expect(list.every((g: any) => g.sport === 'running')).toBe(true)
	})
}) 
