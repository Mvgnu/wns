# Payments integration scaffolding

`stripe.ts` initializes a lazy Stripe client and offers helpers for syncing group membership tiers into Stripe products and
prices. The helpers gracefully degrade when no `STRIPE_SECRET_KEY` is configured so local development can continue without
external dependencies.

`app/api/payments/stripe/checkout/route.ts` exposes a membership checkout endpoint that:

- requires an authenticated session and a valid membership tier identifier,
- syncs the tier with Stripe to guarantee a current product/price pairing,
- creates a Checkout Session with promotion codes enabled and default redirect URLs, and
- honors an `Idempotency-Key` header (or derives one from the user and tier) to avoid duplicate purchases.

`app/api/payments/stripe/webhook/route.ts` verifies Stripe signatures and reacts to Checkout Session, Invoice, Subscription, Refund, and Dispute events to create or update group memberships with current billing status, Stripe identifiers, and revenue ledger entries while mirroring risk outcomes into audit trails.

`lib/payments/revenue.ts` manages the organizer revenue ledger, exposing helpers to upsert Stripe-driven entries, aggregate group summaries, and list recent transactions for dashboards. The payout models extend this ledger so organizer consoles can surface automated transfer schedules, manual payout requests, and resulting disbursement history.

`lib/payments/coupons.ts` centralizes membership coupon management by normalizing codes, validating redemption windows, syncing promotion codes with Stripe, and recording redemptions for analytics.

`lib/payments/audit.ts` maintains payment audit trails by upserting refund and dispute records, keeping organizer risk reviews in sync with Stripe while tying entries back to memberships and ledger events.
