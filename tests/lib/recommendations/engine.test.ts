import { vi } from 'vitest'
import { calculateEventScore } from '@/lib/recommendations/engine'

vi.mock('geolib', () => ({
  __esModule: true,
  default: { getDistance: () => 1500 },
  getDistance: () => 1500,
}))

describe('calculateEventScore', () => {
  it('boosts score based on affinity, distance, and recency', () => {
    const now = new Date()

    const event = {
      id: 'event-1',
      title: 'Morning Tennis',
      startTime: new Date(now.getTime() + 60 * 60 * 1000),
      endTime: null,
      group: {
        id: 'group-1',
        name: 'Tennis Pros',
        sport: 'tennis',
        image: null,
        city: 'Berlin',
        state: 'BE',
        country: 'DE',
        latitude: 52.52,
        longitude: 13.405,
      },
      location: null,
      _count: {
        rsvps: 8,
      },
    } as any

    const user = {
      latitude: 52.5,
      longitude: 13.4,
      sports: ['tennis'],
      location: 'Berlin',
      state: 'BE',
      city: 'Berlin',
    }

    const affinityContext = {
      userId: 'user-1',
      weights: new Map<string, number>([['tennis', 3]]),
    }

    const score = calculateEventScore(event, user, affinityContext)

    expect(score).toBeGreaterThan(60)
  })
})
