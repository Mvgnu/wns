import { describe, expect, it } from 'vitest';
import { aggregateHotspots, summariseHotspot } from '@/lib/geo/hotspots';

const basePoint = { latitude: 48.1351, longitude: 11.582 }; // Munich

describe('aggregateHotspots', () => {
  it('groups nearby points into a hotspot', () => {
    const sources = [
      { ...basePoint, id: 'a', sport: 'running' },
      { latitude: 48.136, longitude: 11.583, id: 'b', sport: 'running' },
      { latitude: 48.2, longitude: 11.6, id: 'c', sport: 'cycling' },
    ];

    const hotspots = aggregateHotspots(sources, {
      sourceToPayload: value => ({ id: value.id, sport: value.sport }),
    });

    expect(hotspots).toHaveLength(2);
    const dominant = hotspots[0];
    expect(dominant.payloads).toHaveLength(2);
  });
});

describe('summariseHotspot', () => {
  it('computes the dominant sport metadata', () => {
    const hotspot = aggregateHotspots(
      [
        { ...basePoint, sport: 'running' },
        { latitude: 48.136, longitude: 11.582, sport: 'cycling' },
        { latitude: 48.1362, longitude: 11.5822, sport: 'running' },
      ],
      { sourceToPayload: source => ({ sport: source.sport }) }
    )[0];

    const summary = summariseHotspot(hotspot);
    expect(summary.dominantSport).toBe('running');
    expect(summary.total).toBe(3);
  });
});
