import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserProfileHeader from '@/components/profile/user-profile-header';
import UserProfileGroups from '@/components/profile/user-profile-groups';
import UserProfilePosts from '@/components/profile/user-profile-posts';
import UserProfileLocations from '@/components/profile/user-profile-locations';
import UserProfileEvents from '@/components/profile/user-profile-events';
import UserProfileStats from '@/components/profile/user-profile-stats';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ProfilePageProps {
  params: {
    id: string;
  };
}

// Define a custom user profile type that matches our selection
type ProfileUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  bio: string | null;
  location: string | null;
  sports: string[];
  latitude: number | null;
  longitude: number | null;
  ownedGroups: {
    id: string;
    name: string;
    sport: string;
  }[];
  memberGroups: {
    id: string;
    name: string;
    sport: string;
  }[];
};

// Define types for Post and Group
type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
};

type Group = {
  id: string;
  name: string;
  sport: string;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!user) {
    return {
      title: "Benutzer nicht gefunden",
    };
  }

  return {
    title: `${user.name}s Profil - WNS Community`,
    description: `${user.name}s Profil auf WNS Community ansehen`,
  };
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = params.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      sports: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      ownedGroups: {
        select: {
          id: true,
          name: true,
          sport: true,
        }
      },
      memberGroups: {
        select: {
          id: true,
          name: true,
          sport: true,
        }
      }
    }
  }) as ProfileUser | null;
  
  if (!user) {
    notFound();
  }
  
  // Check if the profile belongs to the current user
  const isOwnProfile = session?.user?.id === user.id;
  
  // Count user's stats
  const eventsCount = await prisma.event.count({
    where: { organizerId: user.id },
  });
  
  const postsCount = await prisma.post.count({
    where: { authorId: user.id },
  });
  
  const locationsCount = await prisma.location.count({
    where: { addedById: user.id },
  });
  
  const groupsCount = (user.ownedGroups ? user.ownedGroups.length : 0) + (user.memberGroups ? user.memberGroups.length : 0);
  
  // Get user's upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      OR: [
        { organizerId: user.id },
        { attendees: { some: { id: user.id } } },
      ],
      startTime: {
        gte: new Date(),
      },
    },
    take: 3,
    orderBy: {
      startTime: 'asc',
    },
  });
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User Profile Header - Full width on mobile, spans 12 columns on larger screens */}
        <div className="col-span-full">
          <UserProfileHeader 
            user={user as any} 
            isOwnProfile={isOwnProfile} 
          />
        </div>
        
        {/* User Stats - Full width on mobile, spans 4 columns on larger screens */}
        <div className="md:col-span-4">
          <UserProfileStats 
            user={user as any}
            stats={{
              groups: groupsCount,
              events: eventsCount,
              posts: postsCount,
              locations: locationsCount
            }}
            upcomingEvents={upcomingEvents}
          />
        </div>
        
        {/* User Activity Tabs - Full width on mobile, spans 8 columns on larger screens */}
        <div className="md:col-span-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4">
              <UserProfilePosts userId={user.id} />
            </TabsContent>
            
            <TabsContent value="groups" className="space-y-4">
              <UserProfileGroups userId={user.id} />
            </TabsContent>
            
            <TabsContent value="events" className="space-y-4">
              <UserProfileEvents userId={user.id} />
            </TabsContent>
            
            <TabsContent value="locations" className="space-y-4">
              <UserProfileLocations userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 