import { PrismaClient } from '@prisma/client';

/**
 * This script handles the migration of data from the old Location schema to the new enhanced schema.
 * Run this after applying the new schema migration.
 */

const prisma = new PrismaClient();

async function migrateLocationData() {
  console.log('Starting location data migration...');

  try {
    // Get all locations
    const locations = await prisma.location.findMany();
    console.log(`Found ${locations.length} locations to migrate`);

    // Map old type to new placeType and detailType
    const typeMapping: Record<string, { placeType: string, detailType: string }> = {
      // Facility types
      'skatepark': { placeType: 'facility', detailType: 'skatepark' },
      'gym': { placeType: 'facility', detailType: 'gym' },
      'studio': { placeType: 'facility', detailType: 'studio' },
      'court': { placeType: 'facility', detailType: 'court' },
      'field': { placeType: 'facility', detailType: 'field' },
      'pool': { placeType: 'facility', detailType: 'pool' },
      
      // Trail types
      'trail': { placeType: 'trail', detailType: 'hiking' },
      'route': { placeType: 'trail', detailType: 'route' },
      'bikepath': { placeType: 'trail', detailType: 'biking' },
      'runningtrack': { placeType: 'trail', detailType: 'running' },
      
      // Spot types
      'spot': { placeType: 'spot', detailType: 'general' },
      'viewpoint': { placeType: 'spot', detailType: 'viewpoint' },
      'water': { placeType: 'spot', detailType: 'water' },
      'crag': { placeType: 'spot', detailType: 'climbing' },
      
      // Default fallback
      'default': { placeType: 'spot', detailType: 'general' },
    };

    // Update each location
    for (const location of locations) {
      // Get the mapping or use default
      const { placeType, detailType } = typeMapping[location.type] || typeMapping.default;
      
      // Update the location with the new fields
      await prisma.location.update({
        where: { id: location.id },
        data: {
          placeType,
          detailType,
          // For new JSON fields like openingHours, initialize with empty structure
          openingHours: {},
          // Set default values for other new fields
          verified: false,
          featured: false,
          // For existing trail types with coordinates, try to calculate distance
          ...(location.isLineBased && location.coordinates 
            ? { distance: calculateTrailDistance(location.coordinates) } 
            : {})
        }
      });
      
      // Create default amenities based on type
      if (placeType === 'facility') {
        await createDefaultAmenities(location.id, detailType);
      }
      
      // Make the original creator a staff member
      await prisma.placeStaff.create({
        data: {
          userId: location.addedById,
          locationId: location.id,
          role: 'owner',
          canEditPlace: true,
          canManageEvents: true,
          canManageStaff: true
        }
      });
    }

    console.log('Location data migration completed successfully');
  } catch (error) {
    console.error('Error during location data migration:', error);
    throw error;
  }
}

// Helper function to calculate trail distance from coordinates
function calculateTrailDistance(coordinates: any): number {
  try {
    const coords = Array.isArray(coordinates) ? coordinates : JSON.parse(coordinates);
    
    if (!Array.isArray(coords) || coords.length < 2) {
      return 0;
    }
    
    // Simple calculation summing distances between consecutive points
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i-1];
      const curr = coords[i];
      
      totalDistance += getDistanceFromLatLonInKm(
        prev.lat || prev.latitude,
        prev.lng || prev.longitude,
        curr.lat || curr.latitude,
        curr.lng || curr.longitude
      );
    }
    
    return parseFloat(totalDistance.toFixed(2));
  } catch (e) {
    console.log('Error calculating trail distance:', e);
    return 0;
  }
}

// Haversine formula to calculate distance between two points
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

// Create default amenities based on location type
async function createDefaultAmenities(locationId: string, detailType: string) {
  const defaultAmenities: Record<string, string[]> = {
    'gym': ['Changing Rooms', 'Showers', 'Lockers', 'Water Fountain'],
    'studio': ['Changing Rooms', 'Showers', 'Equipment Rental'],
    'skatepark': ['Parking', 'Restrooms'],
    'court': ['Changing Rooms', 'Water Fountain'],
    'field': ['Parking', 'Restrooms'],
    'pool': ['Changing Rooms', 'Showers', 'Lockers', 'Swimming Lanes']
  };
  
  const amenities = defaultAmenities[detailType] || [];
  
  for (const amenity of amenities) {
    await prisma.placeAmenity.create({
      data: {
        locationId,
        name: amenity
      }
    });
  }
}

// Function to run the complete migration
async function runMigration() {
  try {
    await migrateLocationData();
    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export default runMigration; 