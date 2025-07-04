"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendedPrismaClient = void 0;
exports.extendEvent = extendEvent;
exports.calculateDiscountedPrice = calculateDiscountedPrice;
// Create a Prisma client extension
const extendedPrismaClient = (prisma) => {
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
exports.extendedPrismaClient = extendedPrismaClient;
// Helper function to convert raw event data to typed event with extensions
function extendEvent(event) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return Object.assign(Object.assign({}, event), { isPaid: (_a = event === null || event === void 0 ? void 0 : event.isPaid) !== null && _a !== void 0 ? _a : false, price: (_b = event === null || event === void 0 ? void 0 : event.price) !== null && _b !== void 0 ? _b : null, priceCurrency: (_c = event === null || event === void 0 ? void 0 : event.priceCurrency) !== null && _c !== void 0 ? _c : null, priceDescription: (_d = event === null || event === void 0 ? void 0 : event.priceDescription) !== null && _d !== void 0 ? _d : null, maxAttendees: (_e = event === null || event === void 0 ? void 0 : event.maxAttendees) !== null && _e !== void 0 ? _e : null, isSoldOut: (_f = event === null || event === void 0 ? void 0 : event.isSoldOut) !== null && _f !== void 0 ? _f : false, highlightedAmenities: (_g = event === null || event === void 0 ? void 0 : event.highlightedAmenities) !== null && _g !== void 0 ? _g : [], attendees: (_h = event === null || event === void 0 ? void 0 : event.attendees) !== null && _h !== void 0 ? _h : [], pricingTiers: (_j = event === null || event === void 0 ? void 0 : event.pricingTiers) !== null && _j !== void 0 ? _j : [], discountCodes: (_k = event === null || event === void 0 ? void 0 : event.discountCodes) !== null && _k !== void 0 ? _k : [] });
}
// Calculate final price after applying discount code
function calculateDiscountedPrice(basePrice, discountCode) {
    if (!discountCode)
        return basePrice;
    // Check if discount code is active and within valid date range
    const now = new Date();
    if (!discountCode.isActive ||
        (discountCode.startDate && discountCode.startDate > now) ||
        (discountCode.endDate && discountCode.endDate < now) ||
        (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses)) {
        return basePrice;
    }
    // Apply discount based on type
    if (discountCode.discountType === 'percentage') {
        // Ensure percentage is between 0-100
        const percentage = Math.min(100, Math.max(0, discountCode.discountValue));
        return Math.round(basePrice * (1 - percentage / 100));
    }
    else if (discountCode.discountType === 'fixed') {
        // Ensure discount doesn't exceed price
        return Math.max(0, basePrice - discountCode.discountValue);
    }
    return basePrice;
}
