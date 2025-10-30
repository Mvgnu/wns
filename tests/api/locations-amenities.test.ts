/**
 * @vitest-environment node
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as NextAuth from 'next-auth'
import { POST as LOC_POST, GET as LOC_GET } from '@/app/api/locations/route'
import { GET as AMEN_GET, POST as AMEN_POST } from '@/app/api/places/[id]/amenities/route'
import { DELETE as AMEN_DEL } from '@/app/api/places/[id]/amenities/[amenityId]/route'
import { testDb } from '@/lib/test-utils/database'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
const getServerSessionMock = vi.mocked(NextAuth.getServerSession)

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeIfDatabase('Locations amenities & filters', () => {
        beforeEach(() => { vi.clearAllMocks() })

	it('creates location with amenities and can filter by amenity and difficulty', async () => {
		const user = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: user.id } })

		const body = {
			name: 'Skatepark A',
			type: 'skatepark',
			sport: 'skateboarding',
			sports: ['skateboarding'],
			latitude: 52.5,
			longitude: 13.4,
			amenities: ['parking', 'wifi'],
			difficulty: 'medium',
		}
		const postReq = new NextRequest('http://localhost:3000/api/locations', { method: 'POST', body: JSON.stringify(body) })
		const postRes = await LOC_POST(postReq)
		expect(postRes.status).toBe(201)
		const created = await postRes.json()

		const listReq = new NextRequest('http://localhost:3000/api/locations?amenities=parking&difficulty=medium')
		const listRes = await LOC_GET(listReq)
		expect(listRes.status).toBe(200)
		const listJson = await listRes.json()
		expect(Array.isArray(listJson.locations)).toBe(true)
		expect(listJson.locations.find((l: any) => l.id === created.id)).toBeTruthy()
	}, 15000)

	it('can add and delete amenities via places endpoints', async () => {
		const user = await testDb.createTestUser()
                getServerSessionMock.mockResolvedValue({ user: { id: user.id } })

		const body = {
			name: 'Gym B',
			type: 'gym',
			sport: 'fitness',
			sports: ['fitness'],
			latitude: 50.1,
			longitude: 8.6,
		}
		const postReq = new NextRequest('http://localhost:3000/api/locations', { method: 'POST', body: JSON.stringify(body) })
		const postRes = await LOC_POST(postReq)
		const created = await postRes.json()

		const addReq = new NextRequest(`http://localhost:3000/api/places/${created.id}/amenities`, { method: 'POST', body: JSON.stringify({ amenities: [{ type: 'parking' }] }) })
		const addRes = await AMEN_POST(addReq as any, { params: { id: created.id } } as any)
		expect(addRes.status).toBe(201)
		const added = await addRes.json()
		expect(added.amenities.length).toBeGreaterThan(0)
		const amenityId = added.amenities[0].id

		const getReq = new NextRequest(`http://localhost:3000/api/places/${created.id}/amenities`)
		const getRes = await AMEN_GET(getReq as any, { params: { id: created.id } } as any)
		expect(getRes.status).toBe(200)

		const delReq = new NextRequest(`http://localhost:3000/api/places/${created.id}/amenities/${amenityId}`, { method: 'DELETE' })
		const delRes = await AMEN_DEL(delReq as any, { params: { id: created.id, amenityId } } as any)
		expect(delRes.status).toBe(200)
	}, 15000)
}) 
