/**
 * Test utilities and helpers
 */
import { NextRequest } from 'next/server';
import { getBaseUrl } from './test-utils';

/**
 * Create a mock NextAuth session for testing
 */
export function createMockSession(user: any) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin || false,
    },
    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  };
}

/**
 * Create a mock NextRequest with dynamic base URL
 */
export function createMockRequest(url: string, options?: RequestInit): NextRequest {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  return new NextRequest(fullUrl, options);
}

/**
 * Wait for a specific amount of time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create test data factories
 */
export const testFactories = {
  user: (overrides: any = {}) => ({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'hashedPassword123',
    sports: ['running', 'fitness'],
    latitude: 52.5200,
    longitude: 13.4050,
    locationName: 'Berlin, Germany',
    city: 'Berlin',
    country: 'Germany',
    ...overrides,
  }),

  group: (overrides: any = {}) => ({
    name: 'Test Group',
    description: 'A test group for testing purposes',
    sport: 'running',
    location: 'Berlin',
    locationName: 'Berlin, Germany',
    latitude: 52.5200,
    longitude: 13.4050,
    isPrivate: false,
    activityLevel: 'medium',
    groupTags: ['test', 'running'],
    status: 'active',
    entryRules: {
      requireApproval: false,
      allowPublicJoin: true,
    },
    settings: {
      allowMemberPosts: true,
      allowMemberEvents: true,
      contentModeration: 'low',
    },
    ...overrides,
  }),

  event: (overrides: any = {}) => ({
    title: 'Test Event',
    description: 'A test event for testing purposes',
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000), // 1 hour later
    sport: 'running',
    location: 'Berlin',
    latitude: 52.5200,
    longitude: 13.4050,
    isPaid: false,
    maxAttendees: null,
    joinRestriction: 'everyone',
    isRecurring: false,
    ...overrides,
  }),

  location: (overrides: any = {}) => ({
    name: 'Test Location',
    description: 'A test location for testing purposes',
    sport: 'running',
    latitude: 52.5200,
    longitude: 13.4050,
    address: 'Test Address 123',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Germany',
    zipCode: '10117',
    placeType: 'facility',
    detailType: 'gym',
    verified: false,
    featured: false,
    ...overrides,
  }),
};

