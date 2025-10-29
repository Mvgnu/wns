# Recommendations Module

This folder centralizes personalization logic for the platform.

## Components

- `engine.ts` – orchestrates personalized homepage content, mixing affinity weights, proximity, and activity signals.
- `group-recommendations.ts` – scores groups for authenticated users and records interaction feedback.
- `affinity.ts` – persists sport affinity weights derived from recommendation interactions.

## Data Contracts

- Personalized home payloads are expressed through the `PersonalizedHomeContent` interface (mode, groups, events, spotlight sports).
- Sport affinity weights are stored in the `UserSportAffinity` Prisma model for iterative learning.

Remember to update this document whenever new recommendation surfaces or scoring inputs are introduced.
