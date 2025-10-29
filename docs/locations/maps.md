# Location intelligence maps

These maps surface geospatial insights to help members discover nearby venues and events.

## Hotspot API

- Endpoint: `GET /api/locations/hotspots`
- Query parameters:
  - `limit` (default 12) – maximum hotspots returned (max 50).
  - `cell` (default 2500) – grid cell size in meters for clustering.
  - `radius` (default 1500) – hotspot radius in meters for related event lookups.
- Response: `{ hotspots: Array<Hotspot> }` where each hotspot contains `center`, `dominantSport`, `total`, `venues`, and `nearbyEvents`.

## Frontend integration

- `app/locations/components/LocationsMap.tsx` fetches hotspots client-side and renders dynamic circles plus popups listing high-signal venues and upcoming events.
- Fallback mode: if hotspot fetch fails, the component renders provided locations individually.

## Geo utilities

- `lib/geo/hotspots.ts` implements grid-based aggregation with weight controls.
- `lib/geo/proximity.ts` filters candidates by radius using `geolib`.
- Unit coverage lives in `tests/lib/geo` (Vitest).

## Future ideas

- Persist hotspot snapshots nightly for trend analysis.
- Extend the API with `sport`/`city` filters and caching headers.
- Enrich popups with ride-share or transit links once providers are integrated.
