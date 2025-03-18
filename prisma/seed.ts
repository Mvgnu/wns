import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Define types for Unsplash API response
interface UnsplashImage {
  urls: {
    regular: string;
    small: string;
    thumb: string;
  }
}

interface UnsplashSearchResponse {
  results: UnsplashImage[];
}

// Utility function to fetch images from Unsplash
async function fetchUnsplashImages(query: string, count: number = 1): Promise<string[]> {
  try {
    const response = await axios.get<UnsplashSearchResponse>('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: count,
        client_id: process.env.UNSPLASH_ACCESS_KEY || 'YmD3gR1P7UtO_w3XdpYWuN0Yp_5LlqTshYRoKoaPCIo', // Replace with your access key
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(image => image.urls.regular);
    }
    return [];
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error);
    return [];
  }
}

// Utility function to download an image and store it locally
async function downloadImage(url: string, category: string): Promise<string> {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    
    const fileId = crypto.randomUUID();
    const fileExt = '.jpg';
    const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads', 'images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const fileName = `${fileId}-${category}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, response.data);
    
    return `/uploads/images/${fileName}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    return '';
  }
}

// Sports list for seed data
const sportsCategories = [
  { name: 'skating', displayName: 'Skateboarding', tags: ['urban', 'park', 'street'] },
  { name: 'hiking', displayName: 'Hiking', tags: ['nature', 'mountains', 'trails'] },
  { name: 'biking', displayName: 'Mountain Biking', tags: ['trails', 'downhill', 'cross-country'] },
  { name: 'surfing', displayName: 'Surfing', tags: ['beach', 'waves', 'ocean'] },
  { name: 'climbing', displayName: 'Rock Climbing', tags: ['bouldering', 'top-rope', 'sport'] },
  { name: 'yoga', displayName: 'Yoga', tags: ['flexibility', 'mindfulness', 'strength'] },
  { name: 'running', displayName: 'Running', tags: ['trail', 'road', 'track'] },
  { name: 'kayaking', displayName: 'Kayaking', tags: ['river', 'lake', 'sea'] }
];

// City data with coordinates
const cities = [
  { name: 'Berlin', country: 'Germany', state: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Hamburg', country: 'Germany', state: 'Hamburg', lat: 53.5511, lng: 9.9937 },
  { name: 'Munich', country: 'Germany', state: 'Bavaria', lat: 48.1351, lng: 11.5820 },
  { name: 'Frankfurt', country: 'Germany', state: 'Hesse', lat: 50.1109, lng: 8.6821 },
  { name: 'Cologne', country: 'Germany', state: 'North Rhine-Westphalia', lat: 50.9375, lng: 6.9603 },
];

async function main() {
  console.log('Starting enhanced seed process...');

  // Clean up existing data
  await prisma.notificationPreferences.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.locationReview.deleteMany();
  await prisma.participationResponse.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupAdmin.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.group.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned up existing data');
  
  // Create users with more detailed info
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      sports: ['skating', 'hiking', 'biking'],
      bio: 'Site administrator and enthusiast of various hobby sports. Always looking for new sports to try!',
      image: 'https://i.pravatar.cc/300?u=admin',
      latitude: 52.5200,
      longitude: 13.4050,
      locationName: 'Mitte',
      city: 'Berlin',
      state: 'Berlin',
      country: 'Germany',
      zipCode: '10115',
      interestTags: ['outdoors', 'adventure', 'community'],
      preferredRadius: 25,
      activityLevel: 'high',
      notificationPreferences: {
        create: {
          emailNotifications: true,
          pushNotifications: true,
          eventReminders: true,
          participationQueries: true,
          emailEventInvites: true,
          emailEventReminders: true,
          emailGroupInvites: true,
          emailDirectMessages: true,
          emailWeeklyDigest: true,
          pushNewPosts: true,
          pushEventUpdates: true,
          pushLocationAlerts: true,
        }
      }
    },
  });

  // Create 10 regular users
  const users = [admin];
  
  for (let i = 0; i < 10; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const userSports = sportsCategories
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(s => s.name);
    
    const user = await prisma.user.create({
      data: {
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: hashedPassword,
        sports: userSports,
        bio: `I'm a ${userSports.join(' and ')} enthusiast looking to connect with like-minded people.`,
        image: `https://i.pravatar.cc/300?u=user${i + 1}`,
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
        locationName: city.name,
        city: city.name,
        state: city.state,
        country: city.country,
        zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
        interestTags: userSports.concat(['outdoors', 'adventure', 'community'].sort(() => 0.5 - Math.random()).slice(0, 2)),
        preferredRadius: Math.floor(Math.random() * 30) + 10,
        activityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        notificationPreferences: {
          create: {
            emailNotifications: Math.random() > 0.2,
            pushNotifications: Math.random() > 0.2,
            eventReminders: Math.random() > 0.2,
            participationQueries: Math.random() > 0.2,
            reminderHoursBeforeEvent: [12, 24, 48][Math.floor(Math.random() * 3)],
            emailEventInvites: Math.random() > 0.3,
            emailEventReminders: Math.random() > 0.3,
            emailGroupInvites: Math.random() > 0.3,
            emailDirectMessages: Math.random() > 0.3,
            emailWeeklyDigest: Math.random() > 0.7,
            pushNewPosts: Math.random() > 0.3,
            pushEventUpdates: Math.random() > 0.3,
            pushLocationAlerts: Math.random() > 0.3,
          }
        }
      },
    });
    
    users.push(user);
  }

  console.log(`Created ${users.length} users`);

  // Create groups for each sport category
  const groups = [];
  
  for (const sport of sportsCategories) {
    // Get users interested in this sport
    const interestedUsers = users.filter(user => user.sports.includes(sport.name));
    if (interestedUsers.length < 2) continue;
    
    // Select random owner and members
    const owner = interestedUsers[Math.floor(Math.random() * interestedUsers.length)];
    const members = interestedUsers.filter(u => u.id !== owner.id).slice(0, Math.floor(Math.random() * interestedUsers.length));
    
    // Select a random city
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    // Fetch image from Unsplash
    const images = await fetchUnsplashImages(`${sport.name} sport`, 1);
    const imageUrl = images.length > 0 ? images[0] : `https://source.unsplash.com/random/?${sport.name}`;
    
    // Create group
    const group = await prisma.group.create({
      data: {
        name: `${city.name} ${sport.displayName} Club`,
        description: `A community for ${sport.displayName.toLowerCase()} enthusiasts in ${city.name}. All skill levels welcome!`,
        sport: sport.name,
        location: `${city.name}, ${city.country}`,
        image: imageUrl,
        latitude: city.lat,
        longitude: city.lng,
        locationName: city.name,
        city: city.name,
        state: city.state,
        country: city.country,
        zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
        groupTags: [sport.name, ...sport.tags],
        activityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        isPrivate: Math.random() > 0.7,
        inviteCode: Math.random() > 0.5 ? crypto.randomBytes(3).toString('hex') : null,
        owner: {
          connect: { id: owner.id },
        },
        members: {
          connect: members.map(m => ({ id: m.id })),
        },
      },
    });
    
    // Create group admins
    if (members.length > 0) {
      const adminCount = Math.min(2, members.length);
      const groupAdmins = members.slice(0, adminCount);
      
      for (const admin of groupAdmins) {
        await prisma.groupAdmin.create({
          data: {
            group: { connect: { id: group.id } },
            user: { connect: { id: admin.id } },
          }
        });
      }
    }
    
    groups.push(group);
  }

  console.log(`Created ${groups.length} groups`);

  // Create locations for each sport
  const locations = [];
  
  for (const sport of sportsCategories) {
    // Number of locations to create for this sport
    const locationCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < locationCount; i++) {
      // Select a random city
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      // Get users interested in this sport
      const interestedUsers = users.filter(user => user.sports.includes(sport.name));
      if (interestedUsers.length === 0) continue;
      
      // Select random user to add the location
      const addedBy = interestedUsers[Math.floor(Math.random() * interestedUsers.length)];
      
      // Fetch image from Unsplash
      const images = await fetchUnsplashImages(`${sport.name} location`, 1);
      const imageUrl = images.length > 0 ? images[0] : `https://source.unsplash.com/random/?${sport.name},location`;
      
      // Determine location type
      let locationType = 'spot';
      if (sport.name === 'hiking' || sport.name === 'running' || sport.name === 'biking') {
        locationType = 'trail';
      } else if (sport.name === 'surfing' || sport.name === 'kayaking') {
        locationType = 'water';
      } else if (sport.name === 'climbing') {
        locationType = 'crag';
      } else if (sport.name === 'skating') {
        locationType = 'skatepark';
      } else if (sport.name === 'yoga') {
        locationType = 'studio';
      }
      
      // Create coordinates for line-based locations
      const trailCoordinates = locationType === 'trail' ? [
        { lat: city.lat + (Math.random() - 0.5) * 0.02, lng: city.lng + (Math.random() - 0.5) * 0.02 },
        { lat: city.lat + (Math.random() - 0.5) * 0.02, lng: city.lng + (Math.random() - 0.5) * 0.02 },
        { lat: city.lat + (Math.random() - 0.5) * 0.02, lng: city.lng + (Math.random() - 0.5) * 0.02 },
      ] : undefined;
      
      // Create location
      const location = await prisma.location.create({
        data: {
          name: `${city.name} ${sport.displayName} ${locationType.charAt(0).toUpperCase() + locationType.slice(1)}`,
          description: `A popular ${locationType} for ${sport.displayName.toLowerCase()} in ${city.name}.`,
          type: locationType,
          sport: sport.name,
          sports: [sport.name],
          latitude: city.lat + (Math.random() - 0.5) * 0.05,
          longitude: city.lng + (Math.random() - 0.5) * 0.05,
          address: `Sample Address, ${city.name}, ${city.country}`,
          images: [imageUrl],
          isLineBased: locationType === 'trail',
          coordinates: locationType === 'trail' ? (trailCoordinates as any) : undefined,
          addedBy: {
            connect: { id: addedBy.id },
          },
        },
      });
      
      // Add reviews
      const reviewerCount = Math.floor(Math.random() * 3) + 1;
      const reviewers = interestedUsers.filter(u => u.id !== addedBy.id).slice(0, reviewerCount);
      
      for (const reviewer of reviewers) {
        await prisma.locationReview.create({
          data: {
            rating: Math.floor(Math.random() * 5) / 2 + 2.5, // Rating between 2.5 and 5.0
            comment: `${Math.random() > 0.5 ? 'Great' : 'Excellent'} ${locationType} for ${sport.name}. ${Math.random() > 0.5 ? 'Highly recommended!' : 'I come here regularly.'}`,
            location: {
              connect: { id: location.id },
            },
            user: {
              connect: { id: reviewer.id },
            },
          },
        });
      }
      
      locations.push(location);
    }
  }

  console.log(`Created ${locations.length} locations`);

  // Create events
  const events = [];
  const currentDate = new Date();
  
  // Create past events
  for (let i = 0; i < 5; i++) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - (Math.floor(Math.random() * 30) + 1)); // 1-30 days ago
    
    // Select a random group
    const group = groups[Math.floor(Math.random() * groups.length)];
    if (!group) continue;
    
    // Find matching location for the sport
    const matchingLocations = locations.filter(l => l.sports.includes(group.sport));
    if (matchingLocations.length === 0) continue;
    const location = matchingLocations[Math.floor(Math.random() * matchingLocations.length)];
    
    // Select organizer from group members
    const organizer = await prisma.user.findFirst({
      where: { id: group.ownerId },
    });
    if (!organizer) continue;
    
    // Select attendees from group members
    const groupMembers = await prisma.user.findMany({
      where: {
        OR: [
          { memberGroups: { some: { id: group.id } } },
          { id: group.ownerId }
        ]
      },
    });
    
    const attendeeCount = Math.floor(Math.random() * groupMembers.length) + 1;
    const attendees = groupMembers.slice(0, attendeeCount);
    
    // Create event
    const event = await prisma.event.create({
      data: {
        title: `Past ${group.sport} Event at ${location.name}`,
        description: `Join us for a ${group.sport} session at ${location.name}. All skill levels welcome!`,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + (Math.floor(Math.random() * 3) + 1) * 60 * 60 * 1000), // 1-3 hours later
        image: location.images[0],
        organizer: {
          connect: { id: organizer.id },
        },
        group: {
          connect: { id: group.id },
        },
        location: {
          connect: { id: location.id },
        },
        attendees: {
          connect: attendees.map(a => ({ id: a.id })),
        },
      },
    });
    
    events.push(event);
  }
  
  // Create upcoming events
  for (let i = 0; i < 10; i++) {
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + (Math.floor(Math.random() * 30) + 1)); // 1-30 days in future
    
    // Select a random group
    const group = groups[Math.floor(Math.random() * groups.length)];
    if (!group) continue;
    
    // Find matching location for the sport
    const matchingLocations = locations.filter(l => l.sports.includes(group.sport));
    if (matchingLocations.length === 0) continue;
    const location = matchingLocations[Math.floor(Math.random() * matchingLocations.length)];
    
    // Select organizer from group members
    const organizer = await prisma.user.findFirst({
      where: { id: group.ownerId },
    });
    if (!organizer) continue;
    
    // Select attendees from group members
    const groupMembers = await prisma.user.findMany({
      where: {
        OR: [
          { memberGroups: { some: { id: group.id } } },
          { id: group.ownerId }
        ]
      },
    });
    
    const attendeeCount = Math.floor(Math.random() * groupMembers.length) + 1;
    const attendees = groupMembers.slice(0, attendeeCount);
    
    // Decide if this is a recurring event
    const isRecurring = Math.random() > 0.7;
    
    // Create event
    const event = await prisma.event.create({
      data: {
        title: `${isRecurring ? 'Weekly ' : ''}${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} ${Math.random() > 0.5 ? 'Session' : 'Meetup'} at ${location.name}`,
        description: `Join us for a ${group.sport} session at ${location.name}. All skill levels welcome!`,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + (Math.floor(Math.random() * 3) + 1) * 60 * 60 * 1000), // 1-3 hours later
        image: location.images[0],
        isRecurring,
        recurringPattern: isRecurring ? 'weekly' : null,
        recurringDays: isRecurring ? [futureDate.getDay()] : [],
        recurringEndDate: isRecurring ? new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from start
        organizer: {
          connect: { id: organizer.id },
        },
        group: {
          connect: { id: group.id },
        },
        location: {
          connect: { id: location.id },
        },
        attendees: {
          connect: attendees.map(a => ({ id: a.id })),
        },
      },
    });
    
    // Create participation responses for some non-attending members
    const nonAttendees = groupMembers.filter(m => !attendees.some(a => a.id === m.id));
    
    for (const member of nonAttendees) {
      if (Math.random() > 0.5) {
        await prisma.participationResponse.create({
          data: {
            response: ['no', 'maybe'][Math.floor(Math.random() * 2)],
            event: { connect: { id: event.id } },
            user: { connect: { id: member.id } },
          }
        });
      }
    }
    
    // Create event reminders for some attendees
    for (const attendee of attendees) {
      if (Math.random() > 0.7) {
        await prisma.eventReminder.create({
          data: {
            reminderType: 'attendance_reminder',
            hoursBeforeEvent: [12, 24][Math.floor(Math.random() * 2)],
            sentAt: Math.random() > 0.5 ? new Date() : null,
            event: { connect: { id: event.id } },
            user: { connect: { id: attendee.id } },
          }
        });
      }
    }
    
    events.push(event);
  }

  console.log(`Created ${events.length} events`);

  // Create posts
  const posts = [];
  
  for (const group of groups) {
    // Number of posts to create for this group
    const postCount = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < postCount; i++) {
      // Select a random group member as author
      const groupMembers = await prisma.user.findMany({
        where: {
          OR: [
            { memberGroups: { some: { id: group.id } } },
            { id: group.ownerId }
          ]
        },
      });
      
      if (groupMembers.length === 0) continue;
      const author = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      
      // Fetch image from Unsplash
      const images = await fetchUnsplashImages(`${group.sport}`, 1);
      const imageUrl = images.length > 0 ? images[0] : `https://source.unsplash.com/random/?${group.sport}`;
      
      // Create post
      const post = await prisma.post.create({
        data: {
          title: [
            `${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} Tips for Beginners`,
            `My Recent ${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} Experience`,
            `Best Places for ${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} in ${group.city}`,
            `Looking for ${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} Partners`,
            `${group.sport.charAt(0).toUpperCase() + group.sport.slice(1)} Equipment Recommendations`
          ][Math.floor(Math.random() * 5)],
          content: `This is a sample post about ${group.sport}. It includes information, tips, and questions for the community.`,
          images: [imageUrl],
          videos: [],
          author: {
            connect: { id: author.id },
          },
          group: {
            connect: { id: group.id },
          },
        },
      });
      
      // Create comments
      const commentCount = Math.floor(Math.random() * 5);
      const commenters = groupMembers.filter(m => m.id !== author.id);
      
      for (let j = 0; j < commentCount && j < commenters.length; j++) {
        const commenter = commenters[j];
        
        const comment = await prisma.comment.create({
          data: {
            content: [
              `Great post! I've been practicing ${group.sport} for a while and your tips are spot on.`,
              `Thanks for sharing! I'm looking forward to trying these techniques.`,
              `I also recommend checking out ${locations.find(l => l.sports.includes(group.sport))?.name || 'local spots'} for ${group.sport}.`,
              `Has anyone tried the new ${group.sport} equipment mentioned in the post?`,
              `I'm new to ${group.sport}. Would anyone be willing to give some beginner advice?`
            ][Math.floor(Math.random() * 5)],
            author: {
              connect: { id: commenter.id },
            },
            post: {
              connect: { id: post.id },
            },
          },
        });
        
        // Add reply to some comments
        if (Math.random() > 0.7) {
          await prisma.comment.create({
            data: {
              content: `Thanks for your comment! I'm glad you found it helpful.`,
              author: {
                connect: { id: author.id },
              },
              post: {
                connect: { id: post.id },
              },
              parent: {
                connect: { id: comment.id },
              },
            },
          });
        }
      }
      
      // Add likes
      const likerCount = Math.floor(Math.random() * groupMembers.length);
      const likers = groupMembers.slice(0, likerCount);
      
      for (const liker of likers) {
        await prisma.like.create({
          data: {
            user: {
              connect: { id: liker.id },
            },
            post: {
              connect: { id: post.id },
            },
          },
        });
      }
      
      posts.push(post);
    }
  }

  console.log(`Created ${posts.length} posts with comments and likes`);

  // Create notifications
  // Comment notifications
  for (const post of posts) {
    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
      include: { author: true },
    });
    
    if (comments.length === 0) continue;
    
    // Get post author
    const postAuthor = await prisma.user.findUnique({
      where: { id: post.authorId },
    });
    if (!postAuthor) continue;
    
    // Create notifications for comments
    for (const comment of comments) {
      if (comment.authorId === postAuthor.id) continue; // Skip if author is commenting on own post
      
      await prisma.notification.create({
        data: {
          type: 'comment',
          message: `${comment.author.name} commented on your post "${post.title.length > 30 ? post.title.substring(0, 27) + '...' : post.title}"`,
          read: Math.random() > 0.5,
          createdAt: comment.createdAt,
          linkUrl: `/posts/${post.id}`,
          actorId: comment.authorId,
          user: {
            connect: { id: postAuthor.id },
          },
          relatedId: post.id,
        },
      });
    }
  }
  
  // Event notifications
  for (const event of events) {
    // Skip past events
    if (event.startTime < currentDate) continue;
    
    // Get attendees
    const attendees = await prisma.user.findMany({
      where: { attendingEvents: { some: { id: event.id } } },
    });
    
    // Create event reminder notifications for attendees
    for (const attendee of attendees) {
      if (Math.random() > 0.3) continue; // Only create for some attendees
      
      await prisma.notification.create({
        data: {
          type: 'EVENT_REMINDER',
          message: `Reminder: "${event.title}" is coming up on ${event.startTime.toLocaleDateString()}`,
          read: Math.random() > 0.7,
          createdAt: new Date(currentDate.getTime() - (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000), // 1-3 days ago
          linkUrl: `/events/${event.id}`,
          user: {
            connect: { id: attendee.id },
          },
          relatedId: event.id,
        },
      });
    }
    
    // Create attendance query notifications for group members not yet responded
    if (event.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: event.groupId },
        include: { members: true },
      });
      
      if (group) {
        const nonRespondedMembers = group.members.filter(m => 
          !attendees.some(a => a.id === m.id) && 
          Math.random() > 0.5 // Only create for some members
        );
        
        for (const member of nonRespondedMembers) {
          await prisma.notification.create({
            data: {
              type: 'EVENT_ATTENDANCE_QUERY',
              message: `Will you attend "${event.title}" on ${event.startTime.toLocaleDateString()}?`,
              read: Math.random() > 0.8,
              createdAt: new Date(currentDate.getTime() - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000), // 1-5 days ago
              linkUrl: `/events/${event.id}`,
              user: {
                connect: { id: member.id },
              },
              relatedId: event.id,
            },
          });
        }
      }
    }
  }

  console.log('Created various notifications');

  console.log('Enhanced seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 