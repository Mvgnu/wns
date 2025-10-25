/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST as LOC_POST, GET as LOC_GET } from '@/app/api/locations/route'
import { POST as REVIEW_POST } from '@/app/api/locations/[id]/reviews/route'
import { testDb } from '@/lib/test-utils/database'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
const { getServerSession } = require('next-auth')

describe('Location reviews & ratings', () => {
	beforeEach(() => { jest.clearAllMocks() })

	it('creates a location review and updates average rating', async () => {
		const user = await testDb.createTestUser()
		getServerSession.mockResolvedValue({ user: { id: user.id } })

		// Create a location first
		const locationData = {
			name: 'Test Gym',
			type: 'gym',
			sport: 'fitness',
			sports: ['fitness'],
			latitude: 52.5,
			longitude: 13.4,
		}
		const locReq = new NextRequest('http://localhost:3000/api/locations', { 
			method: 'POST', 
			body: JSON.stringify(locationData) 
		})
		const locRes = await LOC_POST(locReq)
		expect(locRes.status).toBe(201)
		const location = await locRes.json()

		// Create a review
		const reviewData = {
			rating: 4,
			comment: 'Great facility with modern equipment',
		}
		const reviewReq = new NextRequest(`http://localhost:3000/api/locations/${location.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify(reviewData),
		})
		const reviewRes = await REVIEW_POST(reviewReq as any, { params: { id: location.id } } as any)
		expect(reviewRes.status).toBe(201)
		const review = await reviewRes.json()
		expect(review.rating).toBe(4)
		expect(review.comment).toBe('Great facility with modern equipment')

		// Check that location now has the review and updated rating
		const getReq = new NextRequest(`http://localhost:3000/api/locations?id=${location.id}`)
		const getRes = await LOC_GET(getReq)
		expect(getRes.status).toBe(200)
		const updatedLocation = await getRes.json()
		expect(updatedLocation._count.reviews).toBe(1)
		expect(updatedLocation.rating).toBe(4.0)
	}, 15000)

	it('calculates average rating from multiple reviews', async () => {
		const user1 = await testDb.createTestUser()
		const user2 = await testDb.createTestUser()
		getServerSession.mockResolvedValue({ user: { id: user1.id } })

		// Create a location
		const locationData = {
			name: 'Test Trail',
			type: 'trail',
			sport: 'running',
			sports: ['running'],
			latitude: 50.1,
			longitude: 8.6,
		}
		const locReq = new NextRequest('http://localhost:3000/api/locations', { 
			method: 'POST', 
			body: JSON.stringify(locationData) 
		})
		const locRes = await LOC_POST(locReq)
		const location = await locRes.json()

		// First review
		const review1Data = { rating: 5, comment: 'Excellent trail' }
		const review1Req = new NextRequest(`http://localhost:3000/api/locations/${location.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify(review1Data),
		})
		await REVIEW_POST(review1Req as any, { params: { id: location.id } } as any)

		// Second review from different user
		getServerSession.mockResolvedValue({ user: { id: user2.id } })
		const review2Data = { rating: 3, comment: 'Good but could be better' }
		const review2Req = new NextRequest(`http://localhost:3000/api/locations/${location.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify(review2Data),
		})
		await REVIEW_POST(review2Req as any, { params: { id: location.id } } as any)

		// Check average rating
		const getReq = new NextRequest(`http://localhost:3000/api/locations?id=${location.id}`)
		const getRes = await LOC_GET(getReq)
		const updatedLocation = await getRes.json()
		expect(updatedLocation._count.reviews).toBe(2)
		expect(updatedLocation.rating).toBe(4.0) // (5 + 3) / 2 = 4.0
	}, 15000)

	it('prevents duplicate reviews from same user', async () => {
		const user = await testDb.createTestUser()
		getServerSession.mockResolvedValue({ user: { id: user.id } })

		// Create location
		const locationData = {
			name: 'Test Court',
			type: 'court',
			sport: 'basketball',
			sports: ['basketball'],
			latitude: 48.1,
			longitude: 11.6,
		}
		const locReq = new NextRequest('http://localhost:3000/api/locations', { 
			method: 'POST', 
			body: JSON.stringify(locationData) 
		})
		const locRes = await LOC_POST(locReq)
		const location = await locRes.json()

		// First review
		const review1Data = { rating: 4, comment: 'Good court' }
		const review1Req = new NextRequest(`http://localhost:3000/api/locations/${location.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify(review1Data),
		})
		const review1Res = await REVIEW_POST(review1Req as any, { params: { id: location.id } } as any)
		expect(review1Res.status).toBe(201)

		// Second review from same user should fail
		const review2Data = { rating: 5, comment: 'Actually great court' }
		const review2Req = new NextRequest(`http://localhost:3000/api/locations/${location.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify(review2Data),
		})
		const review2Res = await REVIEW_POST(review2Req as any, { params: { id: location.id } } as any)
		expect(review2Res.status).toBe(400)

		// Check only one review exists
		const getReq = new NextRequest(`http://localhost:3000/api/locations?id=${location.id}`)
		const getRes = await LOC_GET(getReq)
		const updatedLocation = await getRes.json()
		expect(updatedLocation._count.reviews).toBe(1)
		expect(updatedLocation.rating).toBe(4.0)
	}, 15000)
}) 