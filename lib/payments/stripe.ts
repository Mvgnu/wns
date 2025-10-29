// feature: organizer-console
import Stripe from 'stripe';
import type { MembershipBillingPeriod } from '@prisma/client';

const STRIPE_API_VERSION: Stripe.StripeConfig['apiVersion'] = '2023-10-16';

let cachedStripe: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (cachedStripe) {
    return cachedStripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.warn('[payments] STRIPE_SECRET_KEY missing – falling back to no-op billing flows');
    return null;
  }

  cachedStripe = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    appInfo: {
      name: 'WNS Organizer Console',
      version: '0.1.0'
    }
  });

  return cachedStripe;
}

type TierStripeContext = {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  priceCents: number;
  billingPeriod: MembershipBillingPeriod;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
};

type StripeSyncResult = {
  productId: string | null;
  priceId: string | null;
  skipped: boolean;
};

function resolveRecurringInterval(period: MembershipBillingPeriod): Stripe.PriceCreateParams.Recurring | undefined {
  if (period === 'month') {
    return { interval: 'month' };
  }

  if (period === 'year') {
    return { interval: 'year' };
  }

  return undefined;
}

export async function syncTierWithStripe(tier: TierStripeContext): Promise<StripeSyncResult> {
  const client = getStripeClient();

  if (!client) {
    return { productId: tier.stripeProductId ?? null, priceId: tier.stripePriceId ?? null, skipped: true };
  }

  const recurring = resolveRecurringInterval(tier.billingPeriod);

  let productId = tier.stripeProductId ?? null;
  let priceId = tier.stripePriceId ?? null;

  if (!productId) {
    const product = await client.products.create({
      name: tier.name,
      description: tier.description ?? undefined,
      metadata: {
        groupMembershipTierId: tier.id
      }
    });

    productId = product.id;
  }

  if (!priceId) {
    const price = await client.prices.create({
      product: productId,
      currency: tier.currency.toLowerCase(),
      unit_amount: tier.priceCents,
      recurring: recurring,
      metadata: {
        groupMembershipTierId: tier.id
      }
    });

    priceId = price.id;
  }

  return { productId, priceId, skipped: false };
}

export function resetStripeCache() {
  cachedStripe = null;
}
