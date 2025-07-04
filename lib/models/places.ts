/**
 * Place types and utility functions
 * This file provides models and helpers for working with different types of places
 */

import { z } from 'zod';

// Place type enum (corresponds to PlaceType in Prisma schema)
export enum PlaceType {
  BUILDING = 'building',
  TRAIL = 'trail',
  SPOT = 'spot'
}

// Place type labels for UI display
export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  [PlaceType.BUILDING]: 'Building/Facility',
  [PlaceType.TRAIL]: 'Trail/Path',
  [PlaceType.SPOT]: 'Activity Spot'
};

// Place type descriptions for tooltips and documentation
export const PLACE_TYPE_DESCRIPTIONS: Record<PlaceType, string> = {
  [PlaceType.BUILDING]: 'Indoor or structural facilities like sports halls, gyms, or clubhouses',
  [PlaceType.TRAIL]: 'Linear outdoor areas like hiking trails, running paths, or cycling routes',
  [PlaceType.SPOT]: 'Specific outdoor locations for activities like climbing spots, viewpoints, or exercise areas'
};

// Place type icons for UI (using common icon names that can be mapped to your icon library)
export const PLACE_TYPE_ICONS: Record<PlaceType, string> = {
  [PlaceType.BUILDING]: 'building',
  [PlaceType.TRAIL]: 'route',
  [PlaceType.SPOT]: 'map-pin'
};

// Place features that might be associated with each place type
export interface PlaceFeature {
  id: string;
  label: string;
  description: string;
  icon: string;
  relevantForTypes: PlaceType[];
}

export const COMMON_PLACE_FEATURES: PlaceFeature[] = [
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
export function getFeaturesForPlaceType(placeType: PlaceType): PlaceFeature[] {
  return COMMON_PLACE_FEATURES.filter(feature => 
    feature.relevantForTypes.includes(placeType)
  );
}

// Helper to determine if place type can have events directly associated
export function canHaveEvents(placeType: PlaceType): boolean {
  // Only trails and spots can have events directly associated
  return placeType === PlaceType.TRAIL || placeType === PlaceType.SPOT;
}

// Helper to determine if place type requires an owner
export function requiresOwner(placeType: PlaceType): boolean {
  // Only buildings require an owner
  return placeType === PlaceType.BUILDING;
}

// Interface for place metadata based on type
export interface PlaceTypeMetadata {
  building?: {
    floors?: number;
    totalArea?: number; // in square meters
    indoorFacilities?: string[];
    openingHours?: {
      [day: string]: string; // e.g., "Monday": "08:00-22:00"
    };
  };
  trail?: {
    length?: number; // in kilometers
    elevationGain?: number; // in meters
    difficulty?: 'easy' | 'moderate' | 'difficult' | 'expert';
    surfaceType?: string;
    loopTrail?: boolean;
    estimatedTime?: number; // in minutes
  };
  spot?: {
    area?: number; // in square meters
    maxCapacity?: number;
    bestTimeToVisit?: string;
    weatherDependent?: boolean;
  };
}

// Function to validate place type-specific metadata
export function validatePlaceMetadata(
  placeType: PlaceType, 
  metadata: PlaceTypeMetadata
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (placeType) {
    case PlaceType.BUILDING:
      if (!metadata.building) {
        errors.push('Building metadata is required for building type places');
      } else {
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
      } else {
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
      } else {
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
export function getDefaultPlaceMetadata(placeType: PlaceType): PlaceTypeMetadata {
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
export const placeCommonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  images: z.array(z.string()).optional(),
  sports: z.array(z.string()),
  sport: z.string(), // Legacy field
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  priceRange: z.enum(['free', 'low', 'medium', 'high']).optional(),
  isAccessible: z.boolean().optional(),
});

/**
 * Building-specific validation schema
 */
export const buildingPlaceSchema = placeCommonSchema.extend({
  type: z.literal(PlaceType.BUILDING),
  capacity: z.number().positive().optional(),
  hasParking: z.boolean().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  openingHours: z.record(z.string(), z.string()).optional(),
  isPublic: z.boolean().optional(),
  ownershipType: z.enum(['public', 'private', 'club', 'commercial']).optional(),
  typeMetadata: z.object({
    floors: z.number().optional(),
    hasElevator: z.boolean().optional(),
    hasChangingRooms: z.boolean().optional(),
    hasShowers: z.boolean().optional(),
    indoorFacilities: z.array(z.string()).optional(),
    outdoorFacilities: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Trail-specific validation schema
 */
export const trailPlaceSchema = placeCommonSchema.extend({
  type: z.literal(PlaceType.TRAIL),
  isLineBased: z.literal(true),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2), // Minimum of 2 coordinates for a trail
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  distance: z.number().positive().optional(),
  elevation: z.number().optional(),
  routeType: z.enum(['loop', 'out-and-back', 'point-to-point']).optional(),
  surfaceType: z.enum(['paved', 'dirt', 'mixed', 'gravel']).optional(),
  typeMetadata: z.object({
    estimatedTime: z.string().optional(), // e.g. "2 hours"
    bestSeason: z.string().optional(),
    trailCondition: z.string().optional(),
    technicalRating: z.string().optional(),
    hazards: z.array(z.string()).optional(),
    waterSources: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Spot-specific validation schema
 */
export const spotPlaceSchema = placeCommonSchema.extend({
  type: z.literal(PlaceType.SPOT),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  spotFeatures: z.array(z.string()).optional(),
  typeMetadata: z.object({
    spotType: z.string().optional(), // e.g. "climbing", "viewpoint", "workout"
    bestTimeOfDay: z.string().optional(),
    restrictions: z.array(z.string()).optional(),
    terrain: z.string().optional(),
    popularFor: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Combined place validation schema
 */
export const placeSchema = z.discriminatedUnion('type', [
  buildingPlaceSchema,
  trailPlaceSchema,
  spotPlaceSchema
]);

export type Place = z.infer<typeof placeSchema>;
export type BuildingPlace = z.infer<typeof buildingPlaceSchema>;
export type TrailPlace = z.infer<typeof trailPlaceSchema>;
export type SpotPlace = z.infer<typeof spotPlaceSchema>;

/**
 * Validation schema for place search
 */
export const placeSearchSchema = z.object({
  query: z.string().optional(),
  type: z.enum([PlaceType.BUILDING, PlaceType.TRAIL, PlaceType.SPOT]).optional(),
  sports: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  priceRange: z.array(z.enum(['free', 'low', 'medium', 'high'])).optional(),
  difficulty: z.array(z.enum(['easy', 'medium', 'hard'])).optional(),
  isAccessible: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type PlaceSearch = z.infer<typeof placeSearchSchema>; 