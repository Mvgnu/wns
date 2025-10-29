# Achievements Catalogue

Achievements provide lightweight progression loops. The onboarding feature seeds the catalogue with the `onboarding-trailblazer` badge. Additional achievements can be inserted through Prisma migrations and surfaced in the profile UI.

Relevant models:
- `Achievement`
- `UserAchievement`

See `lib/onboarding/service.ts` for the automatic award process triggered when onboarding completes.
