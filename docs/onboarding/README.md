# Onboarding Wizard

The onboarding flow collects sport interests, preferred locations, and availability windows to personalise discovery for each member.

## Steps
- **Interests** – members pick core sports plus optional tags and intensity.
- **Location** – captures home base, travel radius, and discovery goals.
- **Availability** – records weekly time slots to seed scheduling automation.
- **Completion** – flips `User.onboardingStatus` to `completed`, unlocks growth programs, and awards the `onboarding-trailblazer` achievement.

## Data Stores
- `UserInterest`
- `UserAvailability`
- `UserOnboardingResponse`
- `User.onboardingStatus`, `User.onboardingStep`

Server helpers live in `lib/onboarding/service.ts`. API routes consume them to keep business logic centralised.
