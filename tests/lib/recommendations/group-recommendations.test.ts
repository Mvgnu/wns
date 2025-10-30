import { vi } from 'vitest';
import { calculateGroupScore } from '@/lib/recommendations/group-recommendations'

vi.mock('geolib', () => ({
  __esModule: true,
  default: { getDistance: () => 3000 },
  getDistance: () => 3000
}))
vi.mock('@/lib/prisma', () => ({
	__esModule: true,
	default: {
		post: { count: vi.fn().mockResolvedValue(6) },
		event: { count: vi.fn().mockResolvedValue(2) },
	},
}))

describe('group recommendations', () => {
	it('calculates higher score for matching sport and proximity and activity', async () => {
		const group = {
			id: 'g1',
			sport: 'tennis',
			latitude: 52.5,
			longitude: 13.4,
			locationName: 'Berlin',
			state: 'BE',
			activityLevel: 'medium',
			groupTags: ['outdoors'],
		} as any
		const user = {
			id: 'u1',
			sports: ['tennis'],
			latitude: 52.51,
			longitude: 13.41,
			location: 'Berlin',
			state: 'BE',
			activityLevel: 'medium',
			interestTags: ['outdoors'],
		} as any

                const score = await calculateGroupScore(group, user, new Map([["tennis", 2]]))
                expect(score.score).toBeGreaterThan(10)
                expect(score.reasons.join(' ')).toMatch(/matches your interests|close|active|location/i)
        })
})