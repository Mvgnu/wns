/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as NextAuth from 'next-auth'
import { POST, GET } from '@/app/api/locations/route'
import { testDb } from '@/lib/test-utils/database'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
const getServerSessionMock = vi.mocked(NextAuth.getServerSession)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Locations API', () => {
        beforeEach(() => { vi.clearAllMocks() })

	it('creates a facility location and returns 201 with mapped fields', async () => {
		const user = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: user.id } })
		const body = {
			name: 'City Gym',
			description: 'Modern gym',
			type: 'gym',
			sport: 'fitness',
			sports: ['fitness'],
			latitude: 52.52,
			longitude: 13.405,
			address: 'Berlin',
			images: ['https://example.com/a.jpg'],
			isLineBased: false,
		}
		const req = new NextRequest('http://localhost:3000/api/locations', { method: 'POST', body: JSON.stringify(body) })
		const res = await POST(req)
		expect(res.status).toBe(201)
		const json = await res.json()
		expect(json.name).toBe('City Gym')
		expect(json.placeType).toBe('facility')
		expect(json.detailType).toBe('gym')
		expect(json.sport).toBe('fitness')
		expect(Array.isArray(json.sports)).toBe(true)
		expect(json.image).toBe('https://example.com/a.jpg')
	})

	it('creates a trail location (line-based) and can GET by id', async () => {
		const user = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: user.id } })
		const body = {
			name: 'Forest Trail',
			description: 'Nice route',
			type: 'trail',
			sport: 'running',
			sports: ['running'],
			latitude: 50.11,
			longitude: 8.68,
			isLineBased: true,
			coordinates: [{ lat: 50.11, lng: 8.68 }, { lat: 50.12, lng: 8.69 }],
		}
		const postReq = new NextRequest('http://localhost:3000/api/locations', { method: 'POST', body: JSON.stringify(body) })
		const postRes = await POST(postReq)
		expect(postRes.status).toBe(201)
		const created = await postRes.json()
		expect(created.placeType).toBe('trail')
		const getReq = new NextRequest(`http://localhost:3000/api/locations?id=${created.id}`)
		const getRes = await GET(getReq)
		expect(getRes.status).toBe(200)
		const got = await getRes.json()
		expect(got.id).toBe(created.id)
		expect(got._count).toBeDefined()
	})

	it('lists locations with sports filter', async () => {
		const req = new NextRequest('http://localhost:3000/api/locations?sports=running,fitness&limit=5&page=1')
		const res = await GET(req)
		expect(res.status).toBe(200)
		const json = await res.json()
		expect(json).toHaveProperty('locations')
		expect(json).toHaveProperty('pagination')
	})
}) 
