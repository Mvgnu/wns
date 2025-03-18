import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import GroupDetailClient from './components/GroupDetailClient';
import { allSports } from '@/lib/sportsData';

type Props = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const groupId = params.id;
  
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return {
        title: 'Group Not Found',
      };
    }

    return {
      title: `${group.name} | WNS Community`,
      description: group.description || `Eine Community für ${group.sport}`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Group',
      description: 'Loading group details...',
    };
  }
}

export default async function GroupPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const group = await db.group.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      sport: true,
      location: true,
      locationName: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      isPrivate: true,
      inviteCode: true,
      ownerId: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      events: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          image: true,
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
          attendees: {
            select: {
              id: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      posts: {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          comments: {
            select: { id: true },
          },
          likes: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Find sport label from sport value
  const sportLabel = allSports.find(s => s.value === group.sport)?.label || group.sport;

  const isOwner = userId === group.ownerId;
  const isMember = userId ? group.members.some(member => member.id === userId) : false;

  // Prepare events with locationName
  const events = group.events.map(event => ({
    ...event,
    locationName: event.location?.name,
    locationId: event.location?.id
  }));

  // Prepare members list
  const members = [
    { ...group.owner, isOwner: true },
    ...group.members.filter(m => m.id !== group.owner.id).map(m => ({ ...m, isOwner: false }))
  ];

  return (
    <GroupDetailClient 
      group={group}
      events={events}
      posts={group.posts}
      members={members}
      isOwner={isOwner}
      isMember={isMember}
      userId={userId}
      sportLabel={sportLabel}
    />
  );
} 