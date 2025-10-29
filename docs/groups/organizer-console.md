# Organizer console

The organizer console located at `/groups/manage/[slug]` equips group owners and admins with tooling to monetize and operate
their communities.

## Capabilities

- Membership analytics summarizing total members, active subscriptions, paying members, and projected monthly recurring
  revenue.
- CRUD workflows for membership tiers, including Stripe synchronization scaffolding so tiers can materialize as Stripe
  products/prices once credentials are configured.
- Sponsorship slot management with lifecycle statuses (draft, scheduled, live, paused, completed), asset links, impression
  goals, and archival.
- Upcoming event summaries to connect programming to monetization funnels.

## Technical highlights

- `lib/groups/organizer-console.ts` centralizes access control, aggregation, and tier/sponsor helpers.
- `lib/payments/stripe.ts` lazily initializes Stripe, supports tier synchronization, and no-ops when keys are missing.
- Server actions in `app/groups/manage/[slug]/actions.ts` mediate mutations and revalidation.
- The page UI is rendered in `app/groups/manage/[slug]/page.tsx` using server components with progressive enhancement ready
  forms.

## Follow-ups

- Persist Stripe product/price identifiers for sponsor placements when sponsorship monetization is defined.
- Build dedicated logs for tier upgrades/downgrades and sponsor performance analytics once data is available.
- Add client-side UX affordances (optimistic state, validation summaries) to the forms.
