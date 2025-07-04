/**
 * Standard amenities for different place types
 * This provides a consistent list of amenities that can be used across the platform.
 */

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string;
  relevantTo: Array<'facility' | 'trail' | 'spot'>;
  defaultFor: string[];
}

/**
 * Predefined list of possible amenities for different place types
 */
export const standardAmenities: Amenity[] = [
  // Facilities
  {
    id: 'parking',
    name: 'Parking',
    icon: 'car',
    description: 'Parking is available',
    relevantTo: ['facility', 'trail', 'spot'],
    defaultFor: ['gym', 'studio', 'skatepark', 'field']
  },
  {
    id: 'restrooms',
    name: 'Restrooms',
    icon: 'toilet',
    description: 'Restrooms are available',
    relevantTo: ['facility', 'trail'],
    defaultFor: ['gym', 'studio', 'skatepark', 'field', 'court', 'pool']
  },
  {
    id: 'changing_rooms',
    name: 'Changing Rooms',
    icon: 'tshirt',
    description: 'Changing rooms are available',
    relevantTo: ['facility'],
    defaultFor: ['gym', 'studio', 'pool']
  },
  {
    id: 'showers',
    name: 'Showers',
    icon: 'shower',
    description: 'Showers are available',
    relevantTo: ['facility'],
    defaultFor: ['gym', 'studio', 'pool']
  },
  {
    id: 'lockers',
    name: 'Lockers',
    icon: 'lock',
    description: 'Lockers are available',
    relevantTo: ['facility'],
    defaultFor: ['gym', 'pool']
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    icon: 'wifi',
    description: 'Free Wi-Fi is available',
    relevantTo: ['facility'],
    defaultFor: ['studio', 'gym']
  },
  {
    id: 'cafe',
    name: 'Café',
    icon: 'coffee',
    description: 'Café or refreshments available',
    relevantTo: ['facility'],
    defaultFor: []
  },
  {
    id: 'equipment_rental',
    name: 'Equipment Rental',
    icon: 'tool',
    description: 'Equipment rental is available',
    relevantTo: ['facility', 'trail'],
    defaultFor: ['studio', 'skatepark', 'pool']
  },
  {
    id: 'accessibility',
    name: 'Wheelchair Accessible',
    icon: 'accessibility',
    description: 'Facilities are wheelchair accessible',
    relevantTo: ['facility', 'trail', 'spot'],
    defaultFor: ['studio', 'gym']
  },
  {
    id: 'shop',
    name: 'Pro Shop',
    icon: 'shopping-bag',
    description: 'Sport equipment shop is available',
    relevantTo: ['facility'],
    defaultFor: []
  },
  {
    id: 'instructor',
    name: 'Instructors Available',
    icon: 'user',
    description: 'Professional instructors are available',
    relevantTo: ['facility'],
    defaultFor: ['studio']
  },
  
  // Trails & Outdoor Locations
  {
    id: 'water_fountain',
    name: 'Water Fountain',
    icon: 'droplet',
    description: 'Drinking water available',
    relevantTo: ['facility', 'trail'],
    defaultFor: ['gym', 'studio', 'court', 'field']
  },
  {
    id: 'picnic_area',
    name: 'Picnic Area',
    icon: 'coffee',
    description: 'Picnic tables or area available',
    relevantTo: ['trail', 'spot'],
    defaultFor: []
  },
  {
    id: 'benches',
    name: 'Benches',
    icon: 'align-justify',
    description: 'Seating benches available',
    relevantTo: ['facility', 'trail', 'spot'],
    defaultFor: ['court', 'field']
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: 'sun',
    description: 'Area is lit for evening use',
    relevantTo: ['facility', 'spot'],
    defaultFor: ['skatepark', 'court', 'field']
  },
  {
    id: 'shelter',
    name: 'Shelter',
    icon: 'home',
    description: 'Sheltered area available',
    relevantTo: ['trail', 'spot'],
    defaultFor: []
  },
  {
    id: 'trail_markers',
    name: 'Trail Markers',
    icon: 'flag',
    description: 'Trail is marked with signs',
    relevantTo: ['trail'],
    defaultFor: ['hiking', 'running', 'biking']
  },
  {
    id: 'viewpoint',
    name: 'Scenic Views',
    icon: 'image',
    description: 'Scenic viewpoints along the way',
    relevantTo: ['trail', 'spot'],
    defaultFor: ['viewpoint']
  },
  {
    id: 'first_aid',
    name: 'First Aid Station',
    icon: 'activity',
    description: 'First aid facilities available',
    relevantTo: ['facility', 'trail'],
    defaultFor: []
  },
  
  // Sport Specific
  {
    id: 'swimming_lanes',
    name: 'Swimming Lanes',
    icon: 'divide',
    description: 'Designated swimming lanes',
    relevantTo: ['facility'],
    defaultFor: ['pool']
  },
  {
    id: 'lifeguard',
    name: 'Lifeguard',
    icon: 'shield',
    description: 'Lifeguard on duty',
    relevantTo: ['facility', 'spot'],
    defaultFor: ['pool']
  },
  {
    id: 'climbing_wall',
    name: 'Climbing Wall',
    icon: 'trending-up',
    description: 'Indoor climbing wall',
    relevantTo: ['facility'],
    defaultFor: []
  }
];

/**
 * Helper function to get default amenities for a specific place type
 */
export function getDefaultAmenities(detailType: string): Amenity[] {
  return standardAmenities.filter(amenity => 
    amenity.defaultFor.includes(detailType)
  );
}

/**
 * Helper function to get relevant amenities for a place type
 */
export function getRelevantAmenities(placeType: 'facility' | 'trail' | 'spot'): Amenity[] {
  return standardAmenities.filter(amenity => 
    amenity.relevantTo.includes(placeType)
  );
} 