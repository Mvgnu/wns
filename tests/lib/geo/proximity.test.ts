import { describe, expect, it } from 'vitest';
import { withinRadius } from '@/lib/geo/proximity';

const origin = { latitude: 48.1351, longitude: 11.582 }; // Munich

const points = [
  { latitude: 48.137, longitude: 11.575, id: 'near' },
  { latitude: 48.2, longitude: 11.6, id: 'far' },
];

describe('withinRadius', () => {
  it('filters points outside the radius', () => {
    const matches = withinRadius(origin, points, 1_000);
    expect(matches).toHaveLength(1);
    expect(matches[0].item.id).toBe('near');
    expect(matches[0].distanceMeters).toBeLessThan(1_000);
  });
});
