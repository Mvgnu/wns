import { PrismaClient } from '@prisma/client';
import { addDays, addMonths, setHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // First, let's get or create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password', // In production, this should be properly hashed
    },
  });

  // Create a test group
  const testGroup = await prisma.group.create({
    data: {
      name: 'Test Sports Group',
      description: 'A group for testing events',
      sport: 'mixed',
      owner: {
        connect: { id: testUser.id },
      },
      isPrivate: true,
      members: {
        connect: [{ id: testUser.id }],
      },
      entryRules: {
        requireApproval: false,
        allowPublicJoin: true,
        inviteOnly: false,
        joinCode: null,
      },
      settings: {
        allowMemberPosts: true,
        allowMemberEvents: false,
        visibility: 'public',
        contentModeration: 'low',
      },
    },
  });

  // Create a test location
  const testLocation = await prisma.location.create({
    data: {
      name: 'Test Sports Center',
      description: 'A location for testing events',
      placeType: 'facility',
      detailType: 'sports_center',
      sport: 'mixed',
      sports: ['basketball', 'volleyball', 'fitness'],
      address: '123 Test Street',
      latitude: 52.5200,
      longitude: 13.4050,
      addedBy: {
        connect: { id: testUser.id },
      },
      type: 'building',
      isPublic: true,
    },
  });

  // 1. Create a simple public event
  const publicEvent = await prisma.event.create({
    data: {
      title: 'Public Sports Meetup',
      description: 'A casual sports meetup open to everyone',
      startTime: addDays(new Date(), 7),
      endTime: addDays(new Date(), 7),
      joinRestriction: 'everyone',
      maxAttendees: 20,
      organizer: {
        connect: { id: testUser.id },
      },
      location: {
        connect: { id: testLocation.id },
      },
      attendees: {
        connect: [{ id: testUser.id }],
      },
    },
  });

  // 2. Create a recurring event
  const recurringEvent = await prisma.event.create({
    data: {
      title: 'Weekly Basketball Training',
      description: 'Regular basketball training sessions',
      startTime: setHours(addDays(new Date(), 1), 18), // Tomorrow at 6 PM
      endTime: setHours(addDays(new Date(), 1), 20), // Tomorrow at 8 PM
      isRecurring: true,
      recurringPattern: 'weekly',
      recurringDays: [1, 3], // Monday and Wednesday
      recurringEndDate: addMonths(new Date(), 3),
      joinRestriction: 'everyone',
      organizer: {
        connect: { id: testUser.id },
      },
      location: {
        connect: { id: testLocation.id },
      },
    },
  });

  // 3. Create a paid event with pricing tiers
  const paidEvent = await prisma.event.create({
    data: {
      title: 'Premium Sports Workshop',
      description: 'Professional training workshop with limited spots',
      startTime: addDays(new Date(), 14),
      endTime: addDays(new Date(), 14),
      isPaid: true,
      price: 50.00,
      priceCurrency: 'EUR',
      priceDescription: 'Multiple ticket tiers available',
      maxAttendees: 30,
      organizer: {
        connect: { id: testUser.id },
      },
      location: {
        connect: { id: testLocation.id },
      },
      pricingTiers: {
        create: [
          {
            name: 'Early Bird',
            description: 'Limited early bird tickets',
            price: 3000, // 30.00 EUR in cents
            capacity: 10,
            endDate: addDays(new Date(), 7),
          },
          {
            name: 'Regular',
            description: 'Regular admission',
            price: 5000, // 50.00 EUR in cents
            capacity: 15,
          },
          {
            name: 'VIP',
            description: 'VIP access with special perks',
            price: 8000, // 80.00 EUR in cents
            capacity: 5,
          },
        ],
      },
      discountCodes: {
        create: [
          {
            code: 'EARLY20',
            discountType: 'percentage',
            discountValue: 20,
            maxUses: 10,
            endDate: addDays(new Date(), 7),
          },
        ],
      },
    },
  });

  // 4. Create a private group event
  const privateGroupEvent = await prisma.event.create({
    data: {
      title: 'Private Group Training',
      description: 'Exclusive training session for group members',
      startTime: addDays(new Date(), 5),
      endTime: addDays(new Date(), 5),
      joinRestriction: 'groupOnly',
      maxAttendees: 15,
      organizer: {
        connect: { id: testUser.id },
      },
      group: {
        connect: { id: testGroup.id },
      },
      location: {
        connect: { id: testLocation.id },
      },
    },
  });

  // 5. Create a location-based event
  const locationEvent = await prisma.event.create({
    data: {
      title: 'Location Open Day',
      description: 'Try out our facilities and meet the trainers',
      startTime: addDays(new Date(), 10),
      endTime: addDays(new Date(), 10),
      joinRestriction: 'everyone',
      maxAttendees: 50,
      organizer: {
        connect: { id: testUser.id },
      },
      location: {
        connect: { id: testLocation.id },
      },
      highlightedAmenities: ['gym', 'parking', 'showers'],
    },
  });

  console.log('Sample events created successfully!');
  console.log({
    publicEvent: publicEvent.id,
    recurringEvent: recurringEvent.id,
    paidEvent: paidEvent.id,
    privateGroupEvent: privateGroupEvent.id,
    locationEvent: locationEvent.id,
  });
}

main()
  .catch((e) => {
    console.error('Error seeding events:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 