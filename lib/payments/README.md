# Payments integration scaffolding

`stripe.ts` initializes a lazy Stripe client and offers helpers for syncing group membership tiers into Stripe products and
prices. The helpers gracefully degrade when no `STRIPE_SECRET_KEY` is configured so local development can continue without
external dependencies.
