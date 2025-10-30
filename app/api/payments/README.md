# Payments API

This directory contains route handlers for payment integrations.

- `stripe/checkout/route.ts`: Authenticated endpoint that creates Stripe Checkout Sessions for membership tiers, syncing the tier metadata before issuing a session, applying validated membership coupons, and respecting idempotency keys.
- `stripe/webhook/route.ts`: Processes Stripe webhook events to activate, renew, or flag memberships by syncing Checkout Sessions, invoices, subscriptions, refunds, and disputes while mirroring membership outcomes to `GroupMemberStatus` and logging audit trails.
- `stripe/earnings/route.ts`: Returns organizer-facing revenue summaries and recent ledger entries for authorized group owners and admins using the Stripe-backed membership ledger.
