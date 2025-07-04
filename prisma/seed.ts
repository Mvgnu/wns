import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Initialize PrismaClient
const prisma = new PrismaClient();

// Sample sports categories
const sportsCategories = [
  { name: 'basketball', displayName: 'Basketball', tags: ['team', 'court', 'ball'] },
  { name: 'soccer', displayName: 'Soccer', tags: ['team', 'field', 'ball'] },
  { name: 'tennis', displayName: 'Tennis', tags: ['racquet', 'court', 'individual'] },
  { name: 'hiking', displayName: 'Hiking', tags: ['outdoors', 'trail', 'nature'] },
  { name: 'climbing', displayName: 'Climbing', tags: ['strength', 'outdoors', 'adventure'] },
  { name: 'swimming', displayName: 'Swimming', tags: ['water', 'endurance', 'technique'] },
  { name: 'skating', displayName: 'Skating', tags: ['urban', 'balance', 'tricks'] },
  { name: 'yoga', displayName: 'Yoga', tags: ['flexibility', 'mindfulness', 'balance'] },
  { name: 'surfing', displayName: 'Surfing', tags: ['water', 'waves', 'balance'] },
  { name: 'running', displayName: 'Running', tags: ['endurance', 'outdoors', 'cardio'] },
  { name: 'biking', displayName: 'Biking', tags: ['cycling', 'outdoors', 'endurance'] },
];

// Sample cities with coordinates
const cities = [
  { name: 'Berlin', state: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Munich', state: 'Bavaria', country: 'Germany', lat: 48.137, lng: 11.576 },
  { name: 'Hamburg', state: 'Hamburg', country: 'Germany', lat: 53.551, lng: 9.993 },
  { name: 'Cologne', state: 'North Rhine-Westphalia', country: 'Germany', lat: 50.938, lng: 6.959 },
  { name: 'Frankfurt', state: 'Hesse', country: 'Germany', lat: 50.11, lng: 8.682 },
];

// Sample user images (could be replaced with actual URLs in production)
const userImages = [
  'https://i.pravatar.cc/300?img=1',
  'https://i.pravatar.cc/300?img=2',
  'https://i.pravatar.cc/300?img=3',
  'https://i.pravatar.cc/300?img=4',
  'https://i.pravatar.cc/300?img=5',
  'https://i.pravatar.cc/300?img=6',
  'https://i.pravatar.cc/300?img=7',
  'https://i.pravatar.cc/300?img=8',
  'https://i.pravatar.cc/300?img=9',
  'https://i.pravatar.cc/300?img=10',
];

// Sample group images
const groupImages = [
  'https://source.unsplash.com/random/800x600/?sports,group',
  'https://source.unsplash.com/random/800x600/?team,sports',
  'https://source.unsplash.com/random/800x600/?outdoor,activity',
  'https://source.unsplash.com/random/800x600/?fitness,club',
  'https://source.unsplash.com/random/800x600/?athletics,team',
];

// Sample event images
const eventImages = [
  'https://source.unsplash.com/random/800x600/?sports,event',
  'https://source.unsplash.com/random/800x600/?tournament,sports',
  'https://source.unsplash.com/random/800x600/?competition,sports',
  'https://source.unsplash.com/random/800x600/?match,sports',
  'https://source.unsplash.com/random/800x600/?game,sports',
];

// Group keywords for naming
const groupKeywords = ['Club', 'Team', 'Community', 'Enthusiasts', 'Association'];

// Event types for naming
const eventTypes = ['Tournament', 'Meetup', 'Practice', 'Workshop', 'Competition'];

// Privacy settings for groups
const groupPrivacySettings = ['public', 'private', 'hidden'];

// Privacy settings for events
const eventPrivacySettings = ['public', 'private', 'members'];

// Main seeding function
async function main() {
  console.log(`Start seeding ...`);

  // Create users
  const passwordHash = await bcrypt.hash("password123", 10);
  
  // Create system admin
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@example.com",
      password: passwordHash,
      image: userImages[0],
      emailVerified: new Date(),
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // Create regular users
  const users = [];
  for (let i = 0; i < 20; i++) {
    const username = `user${i + 1}`;
    const user = await prisma.user.create({
      data: {
        name: `User ${i + 1}`,
        email: `${username}@example.com`,
        password: passwordHash,
        image: userImages[i % userImages.length],
        emailVerified: new Date(),
        latitude: cities[i % cities.length].lat + (Math.random() - 0.5) * 0.1,
        longitude: cities[i % cities.length].lng + (Math.random() - 0.5) * 0.1,
        sports: [sportsCategories[i % sportsCategories.length].name],
      },
    });
    users.push(user);
    console.log(`Created user ${i + 1} with id: ${user.id}`);
  }

  // Create groups
  const groups = [];
  for (const sport of sportsCategories) {
    const groupsPerSport = Math.min(3, Math.floor(Math.random() * 4) + 1); // 1-3 groups per sport
    
    for (let i = 0; i < groupsPerSport; i++) {
      const cityIndex = Math.floor(Math.random() * cities.length);
      const city = cities[cityIndex];
      const privacy = groupPrivacySettings[Math.floor(Math.random() * groupPrivacySettings.length)];
      const createdBy = users[Math.floor(Math.random() * users.length)];
      
      const group = await prisma.group.create({
        data: {
          name: `${city.name} ${sport.displayName} ${groupKeywords[i % groupKeywords.length]}`,
          description: `A group for ${sport.displayName.toLowerCase()} enthusiasts in ${city.name}.`,
          sport: sport.name,
          tags: sport.tags.slice(0, 2),
          privacy,
          image: groupImages[Math.floor(Math.random() * groupImages.length)],
          createdById: createdBy.id,
          latitude: city.lat + (Math.random() - 0.5) * 0.05,
          longitude: city.lng + (Math.random() - 0.5) * 0.05,
          address: `${city.name}, ${city.country}`,
          memberCount: 1,
        },
      });
      
      groups.push(group);
      console.log(`Created group: ${group.name}`);
      
      // Add creator as admin
      await prisma.groupMember.create({
        data: {
          userId: createdBy.id,
          groupId: group.id,
          role: "admin",
        },
      });
      
      // Add some members
      const memberCount = Math.floor(Math.random() * 10) + 5; // 5-15 members
      const potentialMembers = users.filter(u => u.id !== createdBy.id);
      const selectedMembers = potentialMembers
        .sort(() => 0.5 - Math.random())
        .slice(0, memberCount);
      
      for (const member of selectedMembers) {
        const isModerator = Math.random() > 0.8; // 20% chance of being a moderator
        
        await prisma.groupMember.create({
          data: {
            userId: member.id,
            groupId: group.id,
            role: isModerator ? "moderator" : "member",
          },
        });
      }
      
      console.log(`Added ${memberCount} members to group: ${group.name}`);
    }
  }

  // Create events
  const totalEvents = 50; 
  const events = [];
  
  for (let i = 0; i < totalEvents; i++) {
    const isGroupEvent = Math.random() > 0.3; 
    const group = isGroupEvent ? groups[Math.floor(Math.random() * groups.length)] : null;
    const sport = isGroupEvent 
      ? sportsCategories.find(s => s.name === group.sport)
      : sportsCategories[Math.floor(Math.random() * sportsCategories.length)];
    
    const creator = users[Math.floor(Math.random() * users.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Event in next 30 days
    startDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 4) * 15, 0); // Between 8am and 8pm
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1 + Math.floor(Math.random() * 3)); // 1-3 hours duration
    
    const privacy = eventPrivacySettings[Math.floor(Math.random() * eventPrivacySettings.length)];
    const capacity = 5 + Math.floor(Math.random() * 20); // 5-25 participants
    
    const isRecurring = Math.random() > 0.7; // 30% chance of being recurring
    let recurrenceRule = null;
    
    if (isRecurring) {
      const frequencies = ['daily', 'weekly', 'monthly'];
      const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      const interval = Math.floor(Math.random() * 2) + 1; // 1-2
      
      recurrenceRule = {
        frequency,
        interval,
        count: Math.floor(Math.random() * 10) + 5, // 5-15 occurrences
      };
      
      if (frequency === 'weekly') {
        recurrenceRule.byWeekday = ['MO', 'WE', 'FR'][Math.floor(Math.random() * 3)];
      }
    }
    
    const event = await prisma.event.create({
      data: {
        title: `${sport.displayName} ${eventTypes[Math.floor(Math.random() * eventTypes.length)]}`,
        description: `Join us for ${sport.displayName.toLowerCase()} in ${city.name}. All skill levels welcome!`,
        sport: sport.name,
        tags: sport.tags.slice(0, 2),
        startDate,
        endDate,
        latitude: city.lat + (Math.random() - 0.5) * 0.05,
        longitude: city.lng + (Math.random() - 0.5) * 0.05,
        address: `${Math.floor(Math.random() * 100) + 1} Sample St., ${city.name}`,
        images: [eventImages[Math.floor(Math.random() * eventImages.length)]],
        privacy,
        capacity,
        createdById: creator.id,
        groupId: isGroupEvent ? group.id : null,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
      },
    });
    
    events.push(event);
    console.log(`Created event: ${event.title}`);
    
    // Add creator as participant
    await prisma.eventParticipant.create({
      data: {
        userId: creator.id,
        eventId: event.id,
        status: "attending",
      },
    });
    
    // Add random participants
    const participantCount = Math.floor(Math.random() * 10) + 1; // 1-10 participants
    const potentialParticipants = users.filter(u => u.id !== creator.id);
    const selectedParticipants = potentialParticipants
      .sort(() => 0.5 - Math.random())
      .slice(0, participantCount);
    
    for (const participant of selectedParticipants) {
      const statuses = ["attending", "maybe", "invited"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      await prisma.eventParticipant.create({
        data: {
          userId: participant.id,
          eventId: event.id,
          status,
        },
      });
      
      if (status === "attending") {
        // Create notification for attendance 
        await prisma.notification.create({
          data: {
            type: "event_attendance",
            title: `New attendee for ${event.title}`,
            content: `${participant.name} is attending your event`,
            userId: creator.id,
            senderId: participant.id,
            eventId: event.id,
          },
        });
      }
    }
    
    console.log(`Added ${participantCount} participants to event: ${event.title}`);
  }

  console.log("Seeding completed.");
}

// Run main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 