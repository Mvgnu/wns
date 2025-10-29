import * as geolib from 'geolib';

// module: geo-proximity

import type { GeoPoint } from './hotspots';

export interface ProximityMatch<T> {
  distanceMeters: number;
  item: T;
}

export function withinRadius<T extends GeoPoint>(
  origin: GeoPoint,
  candidates: T[],
  radiusMeters: number
): ProximityMatch<T>[] {
  if (!origin || !Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  return candidates
    .map(candidate => ({
      item: candidate,
      distanceMeters: geolib.getDistance(origin, candidate),
    }))
    .filter(match => match.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
