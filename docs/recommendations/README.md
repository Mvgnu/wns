# Recommendations & Personalization

## Overview

The recommendation engine powers personalized content on the homepage and group discovery surfaces. It combines:

- Sport affinity weights stored in `UserSportAffinity`.
- Collaborative signals from group membership and RSVP activity.
- Location proximity scored with `geolib`.
- Trending fallbacks for anonymous visitors.

## Key Flows

1. `lib/recommendations/engine.ts#getPersonalizedHomeContent` orchestrates personalized groups, events, and spotlight sports.
2. `lib/recommendations/group-recommendations.ts` scores candidate groups and records feedback via `/api/groups/recommendations`.
3. `lib/recommendations/affinity.ts` persists incremental affinity adjustments after each recommendation interaction.

## Data Model

- `UserSportAffinity` captures cumulative affinity scores per user and sport.
- Recommendation payloads are exposed via `PersonalizedHomeContent` and consumed by `HomePageClient`.

Keep this document current when signals, scoring weights, or user experiences evolve.
