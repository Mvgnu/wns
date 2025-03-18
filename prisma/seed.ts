import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing data
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.locationReview.deleteMany();
  await prisma.event.deleteMany();
  await prisma.group.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned up existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      sports: ['skating', 'hiking'],
      bio: 'Site administrator and enthusiast of various hobby sports.',
      image: 'https://i.pravatar.cc/150?u=admin',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'John Skater',
      email: 'john@example.com',
      password: hashedPassword,
      sports: ['skating', 'biking'],
      bio: 'Passionate skater and occasional mountain biker.',
      location: 'San Francisco, CA',
      image: 'https://i.pravatar.cc/150?u=john',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Hiker',
      email: 'jane@example.com',
      password: hashedPassword,
      sports: ['hiking', 'running'],
      bio: 'Adventure seeker and trail runner.',
      location: 'Denver, CO',
      image: 'https://i.pravatar.cc/150?u=jane',
    },
  });

  console.log('Created users');

  // Create groups
  const skateGroup = await prisma.group.create({
    data: {
      name: 'SF Skaters Club',
      description: 'A group for skateboard enthusiasts in San Francisco.',
      sport: 'skating',
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e',
      owner: {
        connect: { id: user1.id },
      },
      members: {
        connect: [{ id: admin.id }, { id: user2.id }],
      },
    },
  });

  const hikeGroup = await prisma.group.create({
    data: {
      name: 'Mountain Explorers',
      description: 'Hiking group for adventure seekers.',
      sport: 'hiking',
      location: 'Denver, CO',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
      owner: {
        connect: { id: user2.id },
      },
      members: {
        connect: [{ id: admin.id }],
      },
    },
  });

  console.log('Created groups');

  // Create locations
  const skatepark = await prisma.location.create({
    data: {
      name: 'Golden Gate Park Skatepark',
      description: 'Famous skatepark in San Francisco with various obstacles.',
      type: 'skatepark',
      sport: 'skating',
      latitude: 37.7694,
      longitude: -122.4862,
      address: 'Golden Gate Park, San Francisco, CA',
      images: ['https://images.unsplash.com/photo-1494380146854-118dff935440'],
      addedBy: {
        connect: { id: user1.id },
      },
    },
  });

  const hikingTrail = await prisma.location.create({
    data: {
      name: 'Mount Falcon Trail',
      description: 'Scenic hiking trail with mountain views.',
      type: 'trail',
      sport: 'hiking',
      latitude: 39.6513,
      longitude: -105.2107,
      address: 'Mount Falcon Park, Morrison, CO',
      images: ['https://images.unsplash.com/photo-1490989954783-fa3e8aa88815'],
      isLineBased: true,
      coordinates: [
        { lat: 39.6513, lng: -105.2107 },
        { lat: 39.6523, lng: -105.2097 },
        { lat: 39.6533, lng: -105.2087 },
      ],
      addedBy: {
        connect: { id: user2.id },
      },
    },
  });

  console.log('Created locations');

  // Create events
  const currentDate = new Date();
  const nextWeek = new Date(currentDate);
  nextWeek.setDate(currentDate.getDate() + 7);
  
  const skateEvent = await prisma.event.create({
    data: {
      title: 'Weekend Skate Session',
      description: 'Join us for a fun skateboarding session at Golden Gate Park.',
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      image: 'https://images.unsplash.com/photo-1564734352008-ddc2233456fc',
      organizer: {
        connect: { id: user1.id },
      },
      group: {
        connect: { id: skateGroup.id },
      },
      location: {
        connect: { id: skatepark.id },
      },
      attendees: {
        connect: [{ id: admin.id }, { id: user2.id }],
      },
    },
  });

  const hikeEvent = await prisma.event.create({
    data: {
      title: 'Mountain Exploration Hike',
      description: 'Explore the beautiful Mount Falcon Trail with fellow hikers.',
      startTime: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after the skate event
      endTime: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 5 hours later
      image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182',
      organizer: {
        connect: { id: user2.id },
      },
      group: {
        connect: { id: hikeGroup.id },
      },
      location: {
        connect: { id: hikingTrail.id },
      },
      attendees: {
        connect: [{ id: admin.id }],
      },
    },
  });

  console.log('Created events');

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      title: 'New Tricks I Learned',
      content: 'Today I finally landed my first kickflip after months of practice! Here are some tips that helped me...',
      images: ['https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e'],
      author: {
        connect: { id: user1.id },
      },
      group: {
        connect: { id: skateGroup.id },
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Best Hiking Gear for Beginners',
      content: 'If you\'re new to hiking, here\'s a list of essential gear you should consider investing in...',
      images: ['https://images.unsplash.com/photo-1523731407965-2430cd12f5e4'],
      author: {
        connect: { id: user2.id },
      },
      group: {
        connect: { id: hikeGroup.id },
      },
    },
  });

  console.log('Created posts');

  // Create comments
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Great tips! I\'ll try these next time I go skating.',
      author: {
        connect: { id: admin.id },
      },
      post: {
        connect: { id: post1.id },
      },
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'I\'ve been using these hiking boots for years and they\'re fantastic!',
      author: {
        connect: { id: admin.id },
      },
      post: {
        connect: { id: post2.id },
      },
    },
  });

  const reply1 = await prisma.comment.create({
    data: {
      content: 'Thanks for the feedback! Glad you found it helpful.',
      author: {
        connect: { id: user1.id },
      },
      post: {
        connect: { id: post1.id },
      },
      parent: {
        connect: { id: comment1.id },
      },
    },
  });

  console.log('Created comments');

  // Create likes
  await prisma.like.create({
    data: {
      user: {
        connect: { id: admin.id },
      },
      post: {
        connect: { id: post1.id },
      },
    },
  });

  await prisma.like.create({
    data: {
      user: {
        connect: { id: user2.id },
      },
      post: {
        connect: { id: post1.id },
      },
    },
  });

  await prisma.like.create({
    data: {
      user: {
        connect: { id: user1.id },
      },
      post: {
        connect: { id: post2.id },
      },
    },
  });

  console.log('Created likes');

  // Create location reviews
  await prisma.locationReview.create({
    data: {
      rating: 4.5,
      comment: 'Great skatepark with a variety of obstacles for all skill levels.',
      location: {
        connect: { id: skatepark.id },
      },
      user: {
        connect: { id: user1.id },
      },
    },
  });

  await prisma.locationReview.create({
    data: {
      rating: 5.0,
      comment: 'Beautiful trail with stunning views. Highly recommended!',
      location: {
        connect: { id: hikingTrail.id },
      },
      user: {
        connect: { id: user2.id },
      },
    },
  });

  console.log('Created location reviews');

  // Create notifications
  await prisma.notification.create({
    data: {
      type: 'comment',
      message: 'Admin commented on your post "New Tricks I Learned"',
      user: {
        connect: { id: user1.id },
      },
      relatedId: post1.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'like',
      message: 'Admin liked your post "New Tricks I Learned"',
      user: {
        connect: { id: user1.id },
      },
      relatedId: post1.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'event',
      message: 'You have a new event "Weekend Skate Session" coming up this weekend',
      user: {
        connect: { id: user1.id },
      },
      relatedId: skateEvent.id,
    },
  });

  console.log('Created notifications');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 