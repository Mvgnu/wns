"use strict";
/**
 * Place types and utility functions
 * This file provides models and helpers for working with different types of places
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeSearchSchema = exports.placeSchema = exports.spotPlaceSchema = exports.trailPlaceSchema = exports.buildingPlaceSchema = exports.placeCommonSchema = exports.COMMON_PLACE_FEATURES = exports.PLACE_TYPE_ICONS = exports.PLACE_TYPE_DESCRIPTIONS = exports.PLACE_TYPE_LABELS = exports.PlaceType = void 0;
exports.getFeaturesForPlaceType = getFeaturesForPlaceType;
exports.canHaveEvents = canHaveEvents;
exports.requiresOwner = requiresOwner;
exports.validatePlaceMetadata = validatePlaceMetadata;
exports.getDefaultPlaceMetadata = getDefaultPlaceMetadata;
const zod_1 = require("zod");
// Place type enum (corresponds to PlaceType in Prisma schema)
var PlaceType;
(function (PlaceType) {
    PlaceType["BUILDING"] = "building";
    PlaceType["TRAIL"] = "trail";
    PlaceType["SPOT"] = "spot";
})(PlaceType || (exports.PlaceType = PlaceType = {}));
// Place type labels for UI display
exports.PLACE_TYPE_LABELS = {
    [PlaceType.BUILDING]: 'Building/Facility',
    [PlaceType.TRAIL]: 'Trail/Path',
    [PlaceType.SPOT]: 'Activity Spot'
};
// Place type descriptions for tooltips and documentation
exports.PLACE_TYPE_DESCRIPTIONS = {
    [PlaceType.BUILDING]: 'Indoor or structural facilities like sports halls, gyms, or clubhouses',
    [PlaceType.TRAIL]: 'Linear outdoor areas like hiking trails, running paths, or cycling routes',
    [PlaceType.SPOT]: 'Specific outdoor locations for activities like climbing spots, viewpoints, or exercise areas'
};
// Place type icons for UI (using common icon names that can be mapped to your icon library)
exports.PLACE_TYPE_ICONS = {
    [PlaceType.BUILDING]: 'building',
    [PlaceType.TRAIL]: 'route',
    [PlaceType.SPOT]: 'map-pin'
};
exports.COMMON_PLACE_FEATURES = [
    {
        id: 'parking',
        label: 'Parking Available',
        description: 'Designated parking area for visitors',
        icon: 'car',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]
    },
    {
        id: 'accessible',
        label: 'Wheelchair Accessible',
        description: 'Facilities are accessible for people with mobility impairments',
        icon: 'accessibility',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]
    },
    {
        id: 'restrooms',
        label: 'Restrooms',
        description: 'Public restrooms available',
        icon: 'wc',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]
    },
    {
        id: 'water',
        label: 'Drinking Water',
        description: 'Clean drinking water available',
        icon: 'water-drop',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]
    },
    {
        id: 'changing_rooms',
        label: 'Changing Rooms',
        description: 'Private areas for changing clothes',
        icon: 'door',
        relevantForTypes: [PlaceType.BUILDING]
    },
    {
        id: 'showers',
        label: 'Showers',
        description: 'Shower facilities available',
        icon: 'shower',
        relevantForTypes: [PlaceType.BUILDING]
    },
    {
        id: 'lockers',
        label: 'Lockers',
        description: 'Secure storage for personal belongings',
        icon: 'lock',
        relevantForTypes: [PlaceType.BUILDING]
    },
    {
        id: 'equipment',
        label: 'Equipment Rental',
        description: 'Sports or activity equipment available for rent',
        icon: 'sports',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.SPOT]
    },
    {
        id: 'food',
        label: 'Food Services',
        description: 'Food or beverages available for purchase',
        icon: 'restaurant',
        relevantForTypes: [PlaceType.BUILDING]
    },
    {
        id: 'trail_markers',
        label: 'Trail Markers',
        description: 'Clear markers or signs along the route',
        icon: 'signpost',
        relevantForTypes: [PlaceType.TRAIL]
    },
    {
        id: 'difficulty_rating',
        label: 'Difficulty Rating',
        description: 'Indication of trail difficulty level',
        icon: 'trending-up',
        relevantForTypes: [PlaceType.TRAIL]
    },
    {
        id: 'seating',
        label: 'Seating Areas',
        description: 'Benches or designated seating',
        icon: 'chair',
        relevantForTypes: [PlaceType.SPOT, PlaceType.TRAIL]
    },
    {
        id: 'lighting',
        label: 'Lighting',
        description: 'Area is lit during evening hours',
        icon: 'lightbulb',
        relevantForTypes: [PlaceType.BUILDING, PlaceType.SPOT]
    },
    {
        id: 'wifi',
        label: 'WiFi Available',
        description: 'Public WiFi network available',
        icon: 'wifi',
        relevantForTypes: [PlaceType.BUILDING]
    }
];
// Helper function to get features relevant for a specific place type
function getFeaturesForPlaceType(placeType) {
    return exports.COMMON_PLACE_FEATURES.filter(feature => feature.relevantForTypes.includes(placeType));
}
// Helper to determine if place type can have events directly associated
function canHaveEvents(placeType) {
    // Only trails and spots can have events directly associated
    return placeType === PlaceType.TRAIL || placeType === PlaceType.SPOT;
}
// Helper to determine if place type requires an owner
function requiresOwner(placeType) {
    // Only buildings require an owner
    return placeType === PlaceType.BUILDING;
}
// Function to validate place type-specific metadata
function validatePlaceMetadata(placeType, metadata) {
    const errors = [];
    switch (placeType) {
        case PlaceType.BUILDING:
            if (!metadata.building) {
                errors.push('Building metadata is required for building type places');
            }
            else {
                if (metadata.building.floors && metadata.building.floors <= 0) {
                    errors.push('Number of floors must be greater than 0');
                }
                if (metadata.building.totalArea && metadata.building.totalArea <= 0) {
                    errors.push('Total area must be greater than 0');
                }
            }
            break;
        case PlaceType.TRAIL:
            if (!metadata.trail) {
                errors.push('Trail metadata is required for trail type places');
            }
            else {
                if (metadata.trail.length && metadata.trail.length <= 0) {
                    errors.push('Trail length must be greater than 0');
                }
                if (metadata.trail.elevationGain && metadata.trail.elevationGain < 0) {
                    errors.push('Elevation gain cannot be negative');
                }
                if (metadata.trail.estimatedTime && metadata.trail.estimatedTime <= 0) {
                    errors.push('Estimated time must be greater than 0');
                }
            }
            break;
        case PlaceType.SPOT:
            if (!metadata.spot) {
                errors.push('Spot metadata is required for spot type places');
            }
            else {
                if (metadata.spot.area && metadata.spot.area <= 0) {
                    errors.push('Area must be greater than 0');
                }
                if (metadata.spot.maxCapacity && metadata.spot.maxCapacity <= 0) {
                    errors.push('Maximum capacity must be greater than 0');
                }
            }
            break;
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
// Function to get default metadata for a place type
function getDefaultPlaceMetadata(placeType) {
    switch (placeType) {
        case PlaceType.BUILDING:
            return {
                building: {
                    floors: 1,
                    openingHours: {
                        'Monday': '08:00-20:00',
                        'Tuesday': '08:00-20:00',
                        'Wednesday': '08:00-20:00',
                        'Thursday': '08:00-20:00',
                        'Friday': '08:00-20:00',
                        'Saturday': '09:00-18:00',
                        'Sunday': '09:00-18:00'
                    }
                }
            };
        case PlaceType.TRAIL:
            return {
                trail: {
                    difficulty: 'moderate',
                    loopTrail: false
                }
            };
        case PlaceType.SPOT:
            return {
                spot: {
                    weatherDependent: true
                }
            };
        default:
            return {};
    }
}
/**
 * Common place validation schema
 */
exports.placeCommonSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    address: zod_1.z.string().optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    sports: zod_1.z.array(zod_1.z.string()),
    sport: zod_1.z.string(), // Legacy field
    verified: zod_1.z.boolean().optional(),
    featured: zod_1.z.boolean().optional(),
    priceRange: zod_1.z.enum(['free', 'low', 'medium', 'high']).optional(),
    isAccessible: zod_1.z.boolean().optional(),
});
/**
 * Building-specific validation schema
 */
exports.buildingPlaceSchema = exports.placeCommonSchema.extend({
    type: zod_1.z.literal(PlaceType.BUILDING),
    capacity: zod_1.z.number().positive().optional(),
    hasParking: zod_1.z.boolean().optional(),
    website: zod_1.z.string().url().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    openingHours: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    isPublic: zod_1.z.boolean().optional(),
    ownershipType: zod_1.z.enum(['public', 'private', 'club', 'commercial']).optional(),
    typeMetadata: zod_1.z.object({
        floors: zod_1.z.number().optional(),
        hasElevator: zod_1.z.boolean().optional(),
        hasChangingRooms: zod_1.z.boolean().optional(),
        hasShowers: zod_1.z.boolean().optional(),
        indoorFacilities: zod_1.z.array(zod_1.z.string()).optional(),
        outdoorFacilities: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Trail-specific validation schema
 */
exports.trailPlaceSchema = exports.placeCommonSchema.extend({
    type: zod_1.z.literal(PlaceType.TRAIL),
    isLineBased: zod_1.z.literal(true),
    coordinates: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])).min(2), // Minimum of 2 coordinates for a trail
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    distance: zod_1.z.number().positive().optional(),
    elevation: zod_1.z.number().optional(),
    routeType: zod_1.z.enum(['loop', 'out-and-back', 'point-to-point']).optional(),
    surfaceType: zod_1.z.enum(['paved', 'dirt', 'mixed', 'gravel']).optional(),
    typeMetadata: zod_1.z.object({
        estimatedTime: zod_1.z.string().optional(), // e.g. "2 hours"
        bestSeason: zod_1.z.string().optional(),
        trailCondition: zod_1.z.string().optional(),
        technicalRating: zod_1.z.string().optional(),
        hazards: zod_1.z.array(zod_1.z.string()).optional(),
        waterSources: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Spot-specific validation schema
 */
exports.spotPlaceSchema = exports.placeCommonSchema.extend({
    type: zod_1.z.literal(PlaceType.SPOT),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    spotFeatures: zod_1.z.array(zod_1.z.string()).optional(),
    typeMetadata: zod_1.z.object({
        spotType: zod_1.z.string().optional(), // e.g. "climbing", "viewpoint", "workout"
        bestTimeOfDay: zod_1.z.string().optional(),
        restrictions: zod_1.z.array(zod_1.z.string()).optional(),
        terrain: zod_1.z.string().optional(),
        popularFor: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Combined place validation schema
 */
exports.placeSchema = zod_1.z.discriminatedUnion('type', [
    exports.buildingPlaceSchema,
    exports.trailPlaceSchema,
    exports.spotPlaceSchema
]);
/**
 * Validation schema for place search
 */
exports.placeSearchSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    type: zod_1.z.enum([PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]).optional(),
    sports: zod_1.z.array(zod_1.z.string()).optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    radius: zod_1.z.number().optional(),
    verified: zod_1.z.boolean().optional(),
    featured: zod_1.z.boolean().optional(),
    priceRange: zod_1.z.array(zod_1.z.enum(['free', 'low', 'medium', 'high'])).optional(),
    difficulty: zod_1.z.array(zod_1.z.enum(['easy', 'medium', 'hard'])).optional(),
    isAccessible: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().positive().optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
});
