import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Prisma client extensions to add type support for schema extensions
 * This is needed because we're using direct SQL migrations for some fields
 * that might not be reflected in the Prisma schema yet
 */

// Extend the Event model to include pricing, capacity, and amenities fields
export type ExtendedEventSelect = Prisma.EventSelect & {
  isPaid?: boolean;
  price?: boolean;
  priceCurrency?: boolean;
  priceDescription?: boolean;
  maxAttendees?: boolean;
  isSoldOut?: boolean;
  highlightedAmenities?: boolean;
  attendees?: boolean;
  pricingTiers?: boolean;
  discountCodes?: boolean;
};

// Type for pricing tier
export type PricingTier = {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Type for discount code
export type DiscountCode = {
  id: string;
  eventId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ExtendedEvent = {
  isPaid: boolean;
  price: number | null;
  priceCurrency: string | null;
  priceDescription: string | null;
  maxAttendees: number | null;
  isSoldOut: boolean;
  highlightedAmenities: string[];
  attendees?: any[];
  pricingTiers?: PricingTier[];
  discountCodes?: DiscountCode[];
};

// Create a Prisma client extension
export const extendedPrismaClient = (prisma: PrismaClient) => {
  return prisma.$extends({
    name: 'extended-models',
    result: {
      event: {
        // These fields will be included in the result when querying events
        isPaid: {
          needs: {},
          compute: () => false, // Default value
        },
        price: {
          needs: {},
          compute: () => null,
        },
        priceCurrency: {
          needs: {},
          compute: () => null,
        },
        priceDescription: {
          needs: {},
          compute: () => null,
        },
        maxAttendees: {
          needs: {},
          compute: () => null,
        },
        isSoldOut: {
          needs: {},
          compute: () => false,
        },
        highlightedAmenities: {
          needs: {},
          compute: () => [],
        },
        pricingTiers: {
          needs: {},
          compute: () => [],
        },
        discountCodes: {
          needs: {},
          compute: () => [],
        },
      },
    },
  });
};

// Helper function to convert raw event data to typed event with extensions
export function extendEvent<T>(event: T): T & ExtendedEvent {
  return {
    ...event,
    isPaid: (event as any)?.isPaid ?? false,
    price: (event as any)?.price ?? null,
    priceCurrency: (event as any)?.priceCurrency ?? null,
    priceDescription: (event as any)?.priceDescription ?? null,
    maxAttendees: (event as any)?.maxAttendees ?? null,
    isSoldOut: (event as any)?.isSoldOut ?? false,
    highlightedAmenities: (event as any)?.highlightedAmenities ?? [],
    attendees: (event as any)?.attendees ?? [],
    pricingTiers: (event as any)?.pricingTiers ?? [],
    discountCodes: (event as any)?.discountCodes ?? [],
  };
}

// Calculate final price after applying discount code
export function calculateDiscountedPrice(
  basePrice: number,
  discountCode: DiscountCode | null
): number {
  if (!discountCode) return basePrice;
  
  // Check if discount code is active and within valid date range
  const now = new Date();
  if (
    !discountCode.isActive ||
    (discountCode.startDate && discountCode.startDate > now) ||
    (discountCode.endDate && discountCode.endDate < now) ||
    (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses)
  ) {
    return basePrice;
  }
  
  // Apply discount based on type
  if (discountCode.discountType === 'percentage') {
    // Ensure percentage is between 0-100
    const percentage = Math.min(100, Math.max(0, discountCode.discountValue));
    return Math.round(basePrice * (1 - percentage / 100));
  } else if (discountCode.discountType === 'fixed') {
    // Ensure discount doesn't exceed price
    return Math.max(0, basePrice - discountCode.discountValue);
  }
  
  return basePrice;
} 