import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import EventCard from '@/components/events/EventCard';
import JoinGroupButton from '@/components/groups/JoinGroupButton';
import EventList from '@/components/events/EventList';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupPostsList from '@/components/groups/GroupPostsList';
import GroupClientWrapper from './GroupClientWrapper';

type Props = {
  params: {
    id: string;
  };
};

// Adding type definition to handle Prisma schema limitations
type GroupWithPrivacySettings = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sport: string;
  location?: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isPrivate: boolean;
  inviteCode?: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const groupId = params.id;
  
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return {
        title: 'Group Not Found',
      };
    }

    return {
      title: group.name,
      description: group.description || `A group for ${group.sport} enthusiasts`,
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

  const group = await prisma.group.findUnique({
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

  const isOwner = userId === group.ownerId;
  const isMember = group.members.some(member => member.id === userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Group Info */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {/* Add Group Image */}
            <div className="mb-4 h-48 rounded-lg overflow-hidden bg-gray-100">
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <span className="text-4xl font-bold">{group.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {userId && (
                <div className="flex gap-2">
                  {!isMember && <JoinGroupButton groupId={group.id} isPrivate={group.isPrivate} isMember={isMember} />}
                  {isOwner && <GroupClientWrapper type="actions" groupId={group.id} isOwner={isOwner} />}
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">{group.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{group.members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield size={16} />
                <span>{group.sport}</span>
              </div>
              {group.isPrivate && (
                <div className="flex items-center gap-1">
                  <Lock size={16} />
                  <span>Private group</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
              <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
              <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
            </TabsList>
            <TabsContent value="events">
              <GroupClientWrapper type="events" events={group.events} userId={userId} />
            </TabsContent>
            <TabsContent value="posts">
              <GroupPostsList 
                posts={group.posts} 
                groupId={group.id}
                userId={userId}
                isMember={isMember}
              />
            </TabsContent>
            <TabsContent value="members">
              <GroupMembersList 
                members={[
                  { ...group.owner, isOwner: true },
                  ...group.members.filter(m => m.id !== group.owner.id).map(m => ({ ...m, isOwner: false }))
                ]} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 