import * as geolib from 'geolib';

// module: geo-hotspots

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface HotspotCandidate<TPayload = unknown> {
  id: string;
  center: GeoPoint;
  weight: number;
  payloads: TPayload[];
  radiusMeters: number;
}

export interface HotspotOptions<TSource extends GeoPoint> {
  cellSizeMeters?: number;
  radiusMeters?: number;
  sourceToPayload?: (source: TSource) => unknown;
  weightBy?: (source: TSource) => number;
}

const EARTH_CIRCUMFERENCE_METERS = 40_075_000;

function normalizeCoord(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function toCellKey(point: GeoPoint, cellSizeMeters: number) {
  const metersPerDegree = EARTH_CIRCUMFERENCE_METERS / 360;
  const cellSizeDegrees = cellSizeMeters / metersPerDegree;
  const latKey = Math.floor(point.latitude / cellSizeDegrees);
  const lngKey = Math.floor(point.longitude / cellSizeDegrees);
  return `${latKey}:${lngKey}`;
}

export function aggregateHotspots<TSource extends GeoPoint>(
  sources: TSource[],
  options: HotspotOptions<TSource> = {}
): HotspotCandidate[] {
  const {
    cellSizeMeters = 2_500,
    radiusMeters = 1_500,
    sourceToPayload,
    weightBy,
  } = options;

  if (!Array.isArray(sources) || sources.length === 0) {
    return [];
  }

  const grid = new Map<string, HotspotCandidate>();

  for (const source of sources) {
    if (typeof source.latitude !== 'number' || typeof source.longitude !== 'number') {
      continue;
    }
    const latitude = normalizeCoord(source.latitude, -90, 90);
    const longitude = normalizeCoord(source.longitude, -180, 180);
    const key = toCellKey({ latitude, longitude }, cellSizeMeters);
    const existing = grid.get(key);
    const payload = sourceToPayload ? sourceToPayload(source) : source;
    const weight = weightBy ? weightBy(source) : 1;

    if (existing) {
      existing.weight += weight;
      existing.payloads.push(payload);
      const nextCenter = geolib.getCenter([
        { latitude: existing.center.latitude, longitude: existing.center.longitude },
        { latitude, longitude },
      ]);
      if (nextCenter) {
        existing.center = {
          latitude: nextCenter.latitude,
          longitude: nextCenter.longitude,
        };
      }
    } else {
      grid.set(key, {
        id: key,
        center: { latitude, longitude },
        weight,
        payloads: [payload],
        radiusMeters,
      });
    }
  }

  return Array.from(grid.values()).sort((a, b) => b.weight - a.weight);
}

export function summariseHotspot<TPayload extends { sport?: string }>(
  hotspot: HotspotCandidate<TPayload>
) {
  const sports = new Map<string, number>();
  for (const payload of hotspot.payloads) {
    const sportKey = payload?.sport || 'mixed';
    sports.set(sportKey, (sports.get(sportKey) || 0) + 1);
  }

  const sport = Array.from(sports.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mixed';

  return {
    id: hotspot.id,
    center: hotspot.center,
    radiusMeters: hotspot.radiusMeters,
    total: hotspot.weight,
    dominantSport: sport,
  };
}
