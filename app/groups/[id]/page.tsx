import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Lock, MapPin, Calendar, ChevronLeft, Edit, Settings, PlusCircle, Share2, ArrowUpRight, Info, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import EventCard from '@/components/events/EventCard';
import JoinGroupButton from '@/components/groups/JoinGroupButton';
import LeaveGroupButton from '@/components/groups/LeaveGroupButton';
import EventList from '@/components/events/EventList';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupPostsList from '@/components/groups/GroupPostsList';
import GroupClientWrapper from './GroupClientWrapper';
import ShareButtonClient from './ShareButtonClient';
import InviteCodeClient from './InviteCodeClient';

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
      title: `${group.name} - WNS Community`,
      description: group.description || `Eine Sportgruppe für ${group.sport}`,
      openGraph: {
        title: `${group.name} - WNS Community`,
        description: group.description || `Eine Sportgruppe für ${group.sport}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Sportgruppe - WNS Community',
      description: 'Eine Sportgruppe in der WNS Community',
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
      _count: {
        select: {
          members: true,
          events: true,
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const isOwner = userId === group.ownerId;
  const isMember = group.members.some(member => member.id === userId);
  const memberCount = group._count.members;
  const eventCount = group._count.events;
  const createdAtDate = new Date(group.createdAt);
  
  return (
    <div className="relative pb-20">
      {/* Subtle background elements */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50/30 to-white -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent -z-10"></div>
      
      <div className="container max-w-6xl mx-auto px-4 pt-6">
        {/* Back navigation */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-700">
            <Link href="/groups">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>

        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar - Group info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Group Image & Core Info */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {group.image ? (
                <div className="aspect-square relative">
                  <img 
                    src={group.image} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <div className="text-5xl font-bold text-white">
                    {group.name.charAt(0)}
                  </div>
                </div>
              )}
              
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                    {group.sport}
                  </Badge>
                  {group.isPrivate && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Lock className="mr-1 h-3 w-3" />
                      Private Gruppe
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{group.name}</h1>
                
                <div className="space-y-3 text-sm">
                  {group.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{group.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Gegründet am {createdAtDate.toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{memberCount} Mitglieder</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="px-5 pb-5 pt-0 flex flex-wrap gap-2">
                {userId && (
                  <>
                    {!isMember && <JoinGroupButton groupId={group.id} isPrivate={group.isPrivate} isMember={isMember} className="flex-1 min-w-[120px]" />}
                    {isMember && !isOwner && <LeaveGroupButton groupId={group.id} isMember={isMember} />}
                    {isOwner && (
                      <Button variant="outline" className="gap-2 flex-1 min-w-[120px]" asChild>
                        <Link href={`/groups/${group.id}/edit`}>
                          <Settings className="h-4 w-4" />
                          Verwalten
                        </Link>
                      </Button>
                    )}
                  </>
                )}
                <ShareButtonClient groupName={group.name} className="flex-1 min-w-[120px]" />
              </div>
            </div>
            
            {/* About this group */}
            {group.description && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h2 className="text-md font-medium mb-3 flex items-center text-gray-900">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  Über diese Gruppe
                </h2>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{group.description}</p>
              </div>
            )}
            
            {/* Group Admin Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h2 className="text-md font-medium mb-4 flex items-center text-gray-900">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                Gruppenleiter
              </h2>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={group.owner.image || undefined} alt={group.owner.name || 'Admin'} />
                  <AvatarFallback className="bg-blue-100 text-blue-800">{group.owner.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{group.owner.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
            
            {/* Invite Code (for private groups, only for members) */}
            {group.isPrivate && isMember && group.inviteCode && (
              <InviteCodeClient inviteCode={group.inviteCode} />
            )}
          </div>
          
          {/* Main content column */}
          <div className="lg:col-span-8">
            {/* Create event button for members */}
            {userId && isMember && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Organisiere ein Gruppen-Event</h3>
                  <p className="text-gray-600 text-sm">Plane eine Aktivität und lade andere Mitglieder ein</p>
                </div>
                <Button className="gap-2 whitespace-nowrap" asChild>
                  <Link href={`/events/create?groupId=${group.id}`}>
                    <PlusCircle className="h-4 w-4" />
                    Veranstaltung erstellen
                  </Link>
                </Button>
              </div>
            )}
            
            {/* Content tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <Tabs defaultValue="events" className="w-full">
                <div className="px-6 pt-5 border-b border-gray-200">
                  <TabsList className="w-full bg-gray-50 p-1">
                    <TabsTrigger value="events" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Veranstaltungen</span>
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full">{eventCount}</span>
                    </TabsTrigger>
                    <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Mitglieder</span>
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full">{memberCount}</span>
                    </TabsTrigger>
                    <TabsTrigger value="posts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span>Beiträge</span>
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full">{group.posts.length}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="events" className="p-6 pt-5 focus-visible:outline-none focus-visible:ring-0">
                  <GroupClientWrapper 
                    type="events" 
                    events={group.events.map(event => ({
                      ...event,
                      attendees: event.attendees || [],
                      locationName: event.location?.name,
                      locationId: event.location?.id
                    }))} 
                    userId={userId} 
                  />
                </TabsContent>
                
                <TabsContent value="members" className="p-6 pt-5 focus-visible:outline-none focus-visible:ring-0">
                  <GroupMembersList 
                    members={[
                      { ...group.owner, isOwner: true },
                      ...group.members.filter(m => m.id !== group.owner.id).map(m => ({ ...m, isOwner: false }))
                    ]} 
                  />
                </TabsContent>
                
                <TabsContent value="posts" className="p-6 pt-5 focus-visible:outline-none focus-visible:ring-0">
                  <GroupPostsList 
                    posts={group.posts.map(post => ({
                      id: post.id,
                      title: post.title,
                      content: post.content,
                      createdAt: post.createdAt,
                      author: post.author,
                      comments: post.comments,
                      likes: [],
                      images: []
                    }))} 
                    groupId={group.id}
                    userId={userId}
                    isMember={isMember}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 