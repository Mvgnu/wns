import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized. You must be logged in to see available posting targets.' },
      { status: 401 }
    );
  }

  try {
    // Get user's groups
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          // User is a member
          {
            members: {
              some: {
                id: session.user.id
              }
            }
          }
          // Group is public (optional, depending on if public groups should allow posts)
          // {
          //   isPrivate: false
          // }
        ]
      },
      select: {
        id: true,
        name: true,
        image: true,
        isPrivate: true
      }
    });

    // Get locations user can post to (owned locations and public locations)
    const locations = await prisma.location.findMany({
      where: {
        OR: [
          // User is an admin
          {
            addedById: session.user.id
          },
          // Location is public
          {
            isPublic: true
          }
        ]
      },
      select: {
        id: true,
        name: true,
        images: true,
        isPublic: true,
        placeType: true
      }
    });

    // Get events user can post to (events they're attending or organizing)
    const events = await prisma.event.findMany({
      where: {
        OR: [
          // User is organizer
          {
            organizerId: session.user.id
          },
          // User is attending
          {
            attendees: {
              some: {
                id: session.user.id
              }
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        image: true,
        startTime: true,
        endTime: true
      }
    });

    // Format the response
    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      image: group.image,
      type: 'group',
      isPublic: !group.isPrivate
    }));

    const formattedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
      image: location.images?.[0] || null,
      type: 'location',
      isPublic: location.isPublic,
      placeType: location.placeType
    }));

    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      image: event.image,
      type: 'event',
      startTime: event.startTime,
      endTime: event.endTime
    }));

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image
      },
      groups: formattedGroups,
      locations: formattedLocations,
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching post targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post targets' },
      { status: 500 }
    );
  }
} 