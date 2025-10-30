# Product Roadmap

## Current Focus Areas
- **Monetized Event & Membership Commerce**: Productize payments across events, memberships, and sponsorship add-ons to unlock revenue readiness.
- **Post-Event Engagement Loop**: Automate recaps, achievements, and surveys to deepen retention signals.
- **Mobile & Cross-Platform Presence**: Deliver mobile-first experiences and scaffold the Expo companion for cross-platform reach.
- **Trust, Safety & Moderation**: Expand moderation tooling and compliance workflows to protect the community.
- **Operator Tooling & Reliability**: Harden infrastructure with observability, chaos drills, and comprehensive testing.

## Flagship Track Selection
- **Selected Track**: Monetized Event & Membership Commerce
- **Rationale**: Aligns with revenue launch goals, leverages existing Stripe scaffolding, and addresses organizer demand for monetized experiences. Early revenue unlock supports reinvestment in engagement and mobile initiatives.

## Flagship Milestones
1. **Checkout Activation**
   - Complete Stripe webhook handling with idempotency keys.
   - Ship live checkout for paid events and tiered memberships.
   - Owner: Commerce Squad
   - Target: 2025-11-15
  - Status: In progress — membership checkout API live with idempotent session creation, webhook-driven membership syncing, revenue ledger feeds powering organizer earnings summaries, Stripe-backed coupon validation in checkout, automated receipt emails confirming successful charges, tier capacity gating that blocks oversubscription while preserving renewals for existing members, and automatic subscription transitions that cancel superseded plans after upgrades or downgrades.
2. **Organizer Revenue Console**
   - Build pricing catalogs, coupon management, and payout scheduling.
   - Surface earnings dashboards with export support.
   - Owner: Commerce Squad
   - Target: 2025-11-29
   - Status: In progress — revenue dashboard cards, coupon catalog, payout scheduling controls, and Stripe payout reconciliation now live in the organizer console with manual payout requests.
3. **Dispute & Refund Automation**
   - Implement refund / chargeback workflows with audit logs.
   - Integrate dispute notifications into organizer console.
   - Owner: Risk & Finance Ops
   - Target: 2025-12-10
  - Status: In progress — Stripe refund events now populate audit ledgers, organizer consoles surface dispute queues with action logging, and payout webhook idempotency keeps settlement states in sync.

## Key Dependencies
- Stable Vitest harness for API and component suites (TH-002).
- Disposable Postgres instance for end-to-end commerce scenarios.
- Finalized Stripe environment credentials and webhook endpoints.

## Leading KPIs
- Paid conversion rate (trials → paid events/memberships).
- Organizer payout accuracy (variance ≤ 0.5%).
- Dispute resolution time (< 48 hours median).
- Net Promoter Score for organizers (baseline 40 → target 55).

## Upcoming Decisions
- Scope of sponsorship inventory MVP (ads vs. marketplace bundles).
- Sequencing of mobile responsive passes relative to commerce dashboards.
- Experiment design for referral incentives tied to paid conversions.

## Links
- [Test Harness Tracker](./Problem_Tracker_TestHarness.md)
- [Commerce Track Tracker](./Problem_Tracker_Commerce.md)
