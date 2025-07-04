import { PrismaClient, AmenityType as PrismaAmenityType, User, Location } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Sample sports data
const sports = [
  'basketball',
  'soccer', 
  'tennis',
  'hiking',
  'climbing',
  'swimming',
  'skating',
  'yoga',
  'surfing',
  'running',
  'biking',
];

// Sample city data
const cities = [
  { name: 'Berlin', state: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Munich', state: 'Bavaria', country: 'Germany', lat: 48.137, lng: 11.576 },
  { name: 'Hamburg', state: 'Hamburg', country: 'Germany', lat: 53.551, lng: 9.993 },
  { name: 'Cologne', state: 'North Rhine-Westphalia', country: 'Germany', lat: 50.938, lng: 6.959 },
  { name: 'Frankfurt', state: 'Hesse', country: 'Germany', lat: 50.11, lng: 8.682 },
];

// Generate opening hours based on place type
function generateOpeningHours(placeType: string): Record<string, {open: string, close: string}> {
  if (placeType === 'facility') {
    return {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '18:00' }
    };
  } else if (placeType === 'trail') {
    return {
      monday: { open: 'dawn', close: 'dusk' },
      tuesday: { open: 'dawn', close: 'dusk' },
      wednesday: { open: 'dawn', close: 'dusk' },
      thursday: { open: 'dawn', close: 'dusk' },
      friday: { open: 'dawn', close: 'dusk' },
      saturday: { open: 'dawn', close: 'dusk' },
      sunday: { open: 'dawn', close: 'dusk' }
    };
  } else {
    return {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' }
    };
  }
}

// Generate amenities based on place type
function generateAmenities(placeType: string, locationId: string) {
  const amenities = [];
  
  // Basic amenities most places have
  const basicAmenities = [
    { type: "RESTROOM", details: { accessibleForDisabled: Math.random() > 0.3 } },
    { type: "PARKING", details: { free: Math.random() > 0.3, spaces: Math.floor(Math.random() * 50) + 10 } },
    { type: "CARD_PAYMENT", details: { contactless: true } },
  ];
  
  // Facility-specific amenities
  const facilityAmenities = [
    { type: "SHOWER", details: { hot: true, count: Math.floor(Math.random() * 8) + 2 } },
    { type: "LOCKER_ROOM", details: { lockers: Math.floor(Math.random() * 30) + 10, lockProvided: Math.random() > 0.5 } },
    { type: "WIFI", details: { free: true, password: Math.random() > 0.5 } },
    { type: "FOOD", details: { type: ['café', 'restaurant', 'snack bar'][Math.floor(Math.random() * 3)] } },
    { type: "WELLNESS", details: { hasSauna: Math.random() > 0.5, hasSteamRoom: Math.random() > 0.7 } },
    { type: "SHOP", details: { sellsEquipment: true, sellsClothing: Math.random() > 0.5 } },
    { type: "CHILDCARE", details: { maxAge: 10, hourlyRate: Math.floor(Math.random() * 10) + 5 } }
  ];
  
  // Trail-specific amenities
  const trailAmenities = [
    { type: "WATER_FOUNTAIN", details: { available: true } },
    { type: "FIRST_AID", details: { available: Math.random() > 0.3 } },
    { type: "BIKE_STORAGE", details: { secure: Math.random() > 0.5, capacity: Math.floor(Math.random() * 20) + 5 } }
  ];
  
  // Spot-specific amenities
  const spotAmenities = [
    { type: "EQUIPMENT_RENTAL", details: { available: true, hourlyRate: Math.floor(Math.random() * 15) + 5 } },
    { type: "TRAINING_AREA", details: { indoor: Math.random() > 0.5, equipment: Math.random() > 0.3 } },
    { type: "DISABLED_ACCESS", details: { fullyAccessible: Math.random() > 0.7 } }
  ];
  
  // Add basic amenities for all places
  amenities.push(...basicAmenities);
  
  // Add type-specific amenities
  if (placeType === 'facility') {
    amenities.push(...facilityAmenities.slice(0, Math.floor(Math.random() * 5) + 2)); // 2-7 facility amenities
  } else if (placeType === 'trail') {
    amenities.push(...trailAmenities);
  } else {
    amenities.push(...spotAmenities.slice(0, Math.floor(Math.random() * 2) + 1)); // 1-3 spot amenities
  }
  
  // Randomize and slice to get a varied set
  return amenities.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 6) + 3); // 3-9 amenities total
}

// Generate sample videos for a location
function generateVideos(location: Location, uploadedBy: User) {
  const videoCount = Math.floor(Math.random() * 3); // 0-2 videos per location
  const videos = [];
  
  const videoTitles = [
    `Tour of ${location.name}`,
    `Workout at ${location.name}`,
    `${location.sport.charAt(0).toUpperCase() + location.sport.slice(1)} Tips at ${location.name}`,
    `${location.detailType.charAt(0).toUpperCase() + location.detailType.slice(1)} Features at ${location.name}`,
    `Behind the Scenes at ${location.name}`
  ];
  
  const videoPlatforms = [
    'https://www.youtube.com/watch?v=',
    'https://vimeo.com/'
  ];
  
  for (let i = 0; i < videoCount; i++) {
    const videoId = Math.random().toString(36).substring(2, 12); // Random "video ID"
    const platform = videoPlatforms[Math.floor(Math.random() * videoPlatforms.length)];
    
    videos.push({
      title: videoTitles[Math.floor(Math.random() * videoTitles.length)],
      description: `Check out this video from ${location.name} featuring our ${location.sport} facilities.`,
      url: `${platform}${videoId}`,
      thumbnailUrl: `https://source.unsplash.com/random/640x360/?${location.sport},${location.detailType}`,
      duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
      featured: Math.random() > 0.7,
      uploadedById: uploadedBy.id
    });
  }
  
  return videos;
}

// Generate pricing for a location
function generatePricing(location: Location) {
  const priceCount = Math.floor(Math.random() * 5) + 1; // 1-5 price options
  const prices = [];
  
  const pricingOptions = [
    { name: 'Day Pass', period: 'day', isRecurring: false, baseAmount: 10 },
    { name: 'Weekly Pass', period: 'week', isRecurring: false, baseAmount: 40 },
    { name: 'Monthly Membership', period: 'month', isRecurring: true, baseAmount: 80 },
    { name: 'Annual Membership', period: 'year', isRecurring: true, baseAmount: 750 },
    { name: 'Student Discount', period: 'month', isRecurring: true, baseAmount: 60 },
    { name: 'Family Package', period: 'month', isRecurring: true, baseAmount: 150 },
    { name: 'Single Class', period: null, isRecurring: false, baseAmount: 15 },
    { name: '10-Class Package', period: null, isRecurring: false, baseAmount: 120 }
  ];
  
  // Select random pricing options
  const selectedOptions = pricingOptions.sort(() => 0.5 - Math.random()).slice(0, priceCount);
  
  // Generate pricing with some randomization in amounts
  for (const option of selectedOptions) {
    const priceVariation = (Math.random() - 0.5) * 0.2; // -10% to +10% variation
    const amount = option.baseAmount * (1 + priceVariation);
    
    prices.push({
      name: option.name,
      description: `${option.name} for ${location.name}`,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      currency: 'EUR',
      period: option.period,
      isRecurring: option.isRecurring
    });
  }
  
  return prices;
}

// Create users if they don't exist
async function createUsers() {
  // Check if users already exist
  const existingUserCount = await prisma.user.count();
  
  if (existingUserCount > 0) {
    console.log(`Found ${existingUserCount} existing users, skipping user creation.`);
    return prisma.user.findMany({ take: 10 });
  }
  
  console.log('Creating users for location seeding...');
  
  // Sample user images
  const userImages = [
    'https://i.pravatar.cc/300?img=1',
    'https://i.pravatar.cc/300?img=2',
    'https://i.pravatar.cc/300?img=3',
    'https://i.pravatar.cc/300?img=4',
    'https://i.pravatar.cc/300?img=5',
  ];
  
  const passwordHash = await bcryptjs.hash('password123', 10);
  const users = [];
  
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      image: userImages[0],
      emailVerified: new Date(),
    },
  });
  users.push(admin);
  
  // Create regular users
  for (let i = 0; i < 9; i++) {
    const user = await prisma.user.create({
      data: {
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: passwordHash,
        image: userImages[(i + 1) % userImages.length],
        emailVerified: new Date(),
        latitude: cities[i % cities.length].lat,
        longitude: cities[i % cities.length].lng,
      },
    });
    users.push(user);
  }
  
  console.log(`Created ${users.length} users`);
  return users;
}

async function seedLocations() {
  console.log('Starting to seed locations...');
  
  // Get users from the database or create them
  const users = await createUsers();
  
  if (users.length === 0) {
    console.log('No users found and failed to create users. Cannot proceed with location seeding.');
    return;
  }
  
  // Delete existing location data to avoid duplicates
  await prisma.locationReview.deleteMany({});
  await prisma.placeStaff.deleteMany({});
  await prisma.placeAmenity.deleteMany({});
  await prisma.placeClaim.deleteMany({});
  await prisma.location.deleteMany({});
  
  console.log('Deleted existing location data.');
  
  // Create locations for each sport
  for (const sport of sports) {
    const locationsToCreate = Math.floor(Math.random() * 3) + 1; // 1-3 locations per sport
    
    for (let i = 0; i < locationsToCreate; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      // Determine location type based on sport
      let placeType: 'facility' | 'trail' | 'spot' = 'facility';
      let detailType: string = 'gym';
      
      if (['hiking', 'running', 'biking'].includes(sport)) {
        placeType = Math.random() > 0.5 ? 'trail' : 'spot';
        detailType = placeType === 'trail' ? 'hiking' : 'park';
      } else if (['surfing', 'kayaking'].includes(sport)) {
        placeType = 'spot';
        detailType = 'beach';
      } else if (['skating'].includes(sport)) {
        placeType = Math.random() > 0.7 ? 'facility' : 'spot';
        detailType = placeType === 'facility' ? 'arena' : 'skatepark';
      } else if (['climbing'].includes(sport)) {
        placeType = Math.random() > 0.5 ? 'facility' : 'spot';
        detailType = placeType === 'facility' ? 'gym' : 'crag';
      } else if (['yoga'].includes(sport)) {
        detailType = 'studio';
      } else if (['swimming'].includes(sport)) {
        detailType = 'pool';
      }
      
      // Generate coordinates with some random offset
      const latitude = city.lat + (Math.random() - 0.5) * 0.05;
      const longitude = city.lng + (Math.random() - 0.5) * 0.05;
      
      // Generate name for the location
      const locationName = `${city.name} ${sport.charAt(0).toUpperCase() + sport.slice(1)} ${detailType.charAt(0).toUpperCase() + detailType.slice(1)}`;
      
      // Determine if location is featured or verified
      const isFeatured = Math.random() > 0.7;
      const isVerified = Math.random() > 0.5;
      
      // Determine if it's a line-based location (for trails)
      const isLineBased = placeType === 'trail';
      
      // Generate coordinates as JSON structure
      let coordinates: any = { lat: latitude, lng: longitude };
      
      // For trails, create a line of coordinates
      if (isLineBased) {
        const points = [];
        const pointCount = Math.floor(Math.random() * 5) + 3; // 3-7 points
        
        for (let j = 0; j < pointCount; j++) {
          points.push({
            lat: latitude + (Math.random() - 0.5) * 0.03,
            lng: longitude + (Math.random() - 0.5) * 0.03
          });
        }
        coordinates = points;
      }
      
      // Generate opening hours
      const openingHours = generateOpeningHours(placeType);
      
      // Properties specific to place type
      let priceRange: string | null = 'free';
      let hasParking: boolean | null = null;
      let isAccessible: boolean | null = null;
      let capacity: number | null = null;
      let difficulty: string | null = null;
      let distance: number | null = null;
      let elevation: number | null = null;
      let routeType: string | null = null;
      let surfaceType: string | null = null;
      let spotFeatures: string[] = [];
      let typeMetadata: Record<string, any> = {};
      
      if (placeType === 'facility') {
        priceRange = ['free', '$', '$$', '$$$'][Math.floor(Math.random() * 4)];
        hasParking = Math.random() > 0.3;
        isAccessible = Math.random() > 0.4;
        capacity = Math.floor(Math.random() * 200) + 50;
        typeMetadata = {
          floors: Math.floor(Math.random() * 3) + 1,
          hasEquipment: Math.random() > 0.3,
          maintenanceLevel: ['excellent', 'good', 'average'][Math.floor(Math.random() * 3)]
        };
      } else if (placeType === 'trail') {
        difficulty = ['easy', 'moderate', 'difficult'][Math.floor(Math.random() * 3)];
        distance = Math.floor(Math.random() * 10) + 1; // 1-10 km
        elevation = Math.floor(Math.random() * 500) + 50; // 50-550m
        routeType = ['loop', 'out-and-back', 'point-to-point'][Math.floor(Math.random() * 3)];
        surfaceType = ['paved', 'gravel', 'dirt', 'mixed'][Math.floor(Math.random() * 4)];
        typeMetadata = {
          scenery: ['mountain', 'forest', 'coast', 'urban'][Math.floor(Math.random() * 4)],
          bestSeason: ['spring', 'summer', 'fall', 'winter', 'all-year'][Math.floor(Math.random() * 5)]
        };
      } else if (placeType === 'spot') {
        if (sport === 'skating') {
          spotFeatures = ['rail', 'halfpipe', 'bowl', 'stairs', 'ledge'].sort(() => 0.5 - Math.random()).slice(0, 3);
        } else if (sport === 'climbing') {
          spotFeatures = ['bouldering', 'sport routes', 'trad routes', 'top rope'].sort(() => 0.5 - Math.random()).slice(0, 2);
        }
        typeMetadata = {
          popularity: Math.floor(Math.random() * 5) + 1,
          bestTimeToVisit: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
          crowdLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
        };
      }
      
      // Select random user to add the location
      const addedBy = users[Math.floor(Math.random() * users.length)];
      
      try {
        // Create location with all features
        const location = await prisma.location.create({
          data: {
            name: locationName,
            description: `A ${isFeatured ? 'premium' : 'popular'} ${detailType} for ${sport} in ${city.name}.`,
            placeType,
            detailType,
            sport,
            sports: [sport],
            latitude,
            longitude,
            address: `${Math.floor(Math.random() * 100) + 1} Sample St.`,
            city: city.name,
            state: city.state,
            country: city.country,
            zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
            images: [`https://source.unsplash.com/random/?${sport},${detailType}`],
            website: Math.random() > 0.5 ? `https://example.com/${sport}-${detailType}` : null,
            phone: Math.random() > 0.5 ? `+49${Math.floor(Math.random() * 1000000000)}` : null,
            openingHours,
            verified: isVerified,
            featured: isFeatured,
            priceRange,
            hasParking,
            isAccessible,
            capacity,
            isLineBased,
            coordinates,
            difficulty,
            distance,
            elevation,
            addedById: addedBy.id,
            typeMetadata,
            isPublic: Math.random() > 0.2,
            ownershipType: ['public', 'private', 'community'][Math.floor(Math.random() * 3)],
            routeType,
            surfaceType,
            spotFeatures,
            type: "building", // Default type is building
          },
        });
        
        console.log(`Created location: ${location.name} (${location.id})`);
        
        // Add amenities
        const amenities = generateAmenities(placeType, location.id);
        
        for (const amenity of amenities) {
          await prisma.placeAmenity.create({
            data: {
              locationId: location.id,
              type: amenity.type,
              details: amenity.details,
              isAvailable: true
            }
          });
        }
        
        // Add staff members
        await prisma.placeStaff.create({
          data: {
            role: 'owner',
            canEditPlace: true,
            canManageEvents: true,
            canManageStaff: true,
            locationId: location.id,
            userId: addedBy.id,
            title: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Director`,
            bio: `Founder and director of ${locationName} with a passion for ${sport}.`,
            specialties: [sport, ...['coaching', 'training', 'management'].slice(0, Math.floor(Math.random() * 3))],
            certifications: [`${sport.charAt(0).toUpperCase() + sport.slice(1)} Level ${Math.floor(Math.random() * 3) + 1} Certification`],
            yearsExperience: Math.floor(Math.random() * 15) + 5
          }
        });
        
        // Add additional staff members
        const staffCount = Math.floor(Math.random() * 3);
        const staffRoles = [
          { 
            role: 'manager', 
            permissions: { canEditPlace: true, canManageEvents: true, canManageStaff: false },
            title: 'Facility Manager'
          },
          { 
            role: 'coach', 
            permissions: { canEditPlace: false, canManageEvents: true, canManageStaff: false },
            title: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Coach`
          },
          { 
            role: 'staff', 
            permissions: { canEditPlace: false, canManageEvents: false, canManageStaff: false },
            title: 'Staff Member'
          }
        ];
        
        const potentialStaff = users.filter(u => u.id !== addedBy.id);
        const staffMembers = potentialStaff.sort(() => 0.5 - Math.random()).slice(0, staffCount);
        
        for (let j = 0; j < staffMembers.length; j++) {
          const staff = staffMembers[j];
          const staffRole = staffRoles[Math.floor(Math.random() * staffRoles.length)];
          
          await prisma.placeStaff.create({
            data: {
              role: staffRole.role,
              canEditPlace: staffRole.permissions.canEditPlace,
              canManageEvents: staffRole.permissions.canManageEvents,
              canManageStaff: staffRole.permissions.canManageStaff,
              locationId: location.id,
              userId: staff.id,
              title: staffRole.title,
              bio: `${staffRole.title} at ${locationName} specializing in ${sport}.`,
              specialties: [sport],
              yearsExperience: Math.floor(Math.random() * 10) + 1
            }
          });
        }
        
        // Add videos
        const videos = generateVideos(location, addedBy);
        for (const video of videos) {
          // Check if locationVideo exists on prisma client
          if (typeof prisma.locationVideo !== 'undefined') {
            await prisma.locationVideo.create({
              data: {
                locationId: location.id,
                title: video.title,
                description: video.description,
                url: video.url,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                featured: video.featured,
                uploadedById: video.uploadedById
              }
            });
          } else {
            console.log(`Note: LocationVideo model is not available, skipping video creation`);
          }
        }
        
        // Add pricing information
        const prices = generatePricing(location);
        for (const price of prices) {
          // Check if locationPrice exists on prisma client
          if (typeof prisma.locationPrice !== 'undefined') {
            await prisma.locationPrice.create({
              data: {
                locationId: location.id,
                name: price.name,
                description: price.description,
                amount: price.amount,
                currency: price.currency,
                period: price.period,
                isRecurring: price.isRecurring
              }
            });
          } else {
            console.log(`Note: LocationPrice model is not available, skipping price creation`);
          }
        }
        
        // Add reviews
        const reviewCount = Math.floor(Math.random() * 5) + 3; // 3-7 reviews
        const reviewers = users.sort(() => 0.5 - Math.random()).slice(0, reviewCount);
        
        for (const reviewer of reviewers) {
          if (reviewer.id === addedBy.id) continue; // Skip the owner
          
          const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          const cleanliness = Math.floor(Math.random() * 2) + 3; // 3-5 stars 
          const service = Math.floor(Math.random() * 2) + 3; // 3-5 stars
          const value = Math.floor(Math.random() * 2) + 3; // 3-5 stars
          const atmosphere = Math.floor(Math.random() * 2) + 3; // 3-5 stars
          
          await prisma.locationReview.create({
            data: {
              rating,
              cleanliness,
              service,
              value,
              atmosphere,
              reviewTitle: `Great ${detailType} for ${sport}`,
              comment: `I love this ${detailType} for ${sport}. The facilities are ${['excellent', 'great', 'good'][Math.floor(Math.random() * 3)]}.`,
              reviewImages: [],
              locationId: location.id,
              userId: reviewer.id
            }
          });
        }
        
        // Add place claim for some locations
        if (Math.random() > 0.7) {
          const claimant = users.filter(u => u.id !== addedBy.id)[Math.floor(Math.random() * (users.length - 1))];
          const claimStatus = ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)];
          
          const claimData: any = {
            status: claimStatus,
            claimReason: `I am the ${Math.random() > 0.5 ? 'owner' : 'manager'} of this location.`,
            contactEmail: claimant.email || 'contact@example.com',
            contactPhone: `+49${Math.floor(Math.random() * 1000000000)}`,
            locationId: location.id,
            userId: claimant.id,
          };
          
          if (claimStatus !== 'PENDING') {
            claimData.reviewedById = users[0].id;
            claimData.reviewNotes = claimStatus === 'APPROVED' 
              ? 'Claim verified and approved.' 
              : 'Could not verify ownership.';
          }
          
          await prisma.placeClaim.create({
            data: claimData
          });
          
          console.log(`Added claim for ${location.name} with status ${claimStatus}`);
        }
      } catch (error) {
        console.error(`Error creating location ${locationName}:`, error);
      }
    }
  }
  
  console.log('Seeding locations completed!');
}

async function main() {
  try {
    await seedLocations();
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Call main directly
main();

export { seedLocations }; 