import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Lock, MapPin, Calendar, ChevronLeft, Edit, Settings, PlusCircle, Share2, ArrowUpRight, Info, MessageSquare, Activity, Tag } from 'lucide-react';
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

type GroupAdmin = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  }
};

type GroupMemberRole = {
  id: string;
  user: {
    id: string;
    name: string | null;
  };
  role: {
    id: string;
    name: string;
  };
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
      city: true,
      state: true,
      country: true,
      zipCode: true,
      groupTags: true,
      activityLevel: true,
      status: true,
      entryRules: true,
      settings: true,
      slug: true,
      memberCount: true,
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
          groupMemberStatuses: {
            where: { groupId: params.id },
            select: {
              isAnonymous: true,
              status: true
            }
          }
        },
      },
      // Get group admins
      admins: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      },
      // Get roles for this group
      roles: {
        select: {
          id: true,
          name: true,
          description: true
        }
      },
      // Get member roles
      memberRoles: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true
            }
          },
          role: {
            select: {
              id: true,
              name: true
            }
          }
        }
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
  const isAdmin = group.admins.some((admin: GroupAdmin) => admin.user.id === userId);
  const memberCount = group.memberCount || group._count.members;
  const eventCount = group._count.events;
  const createdAtDate = new Date(group.createdAt);
  
  // Parse JSON fields
  const entryRules = group.entryRules ? JSON.parse(typeof group.entryRules === 'string' ? group.entryRules : JSON.stringify(group.entryRules)) : null;
  const settings = group.settings ? JSON.parse(typeof group.settings === 'string' ? group.settings : JSON.stringify(group.settings)) : null;
  
  // Get activity level text
  const getActivityLevelText = (level: string | null | undefined) => {
    switch (level) {
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return 'Nicht angegeben';
    }
  };

  // Get visibility text
  const getVisibilityText = () => {
    if (group.isPrivate) return 'Privat';
    if (settings?.visibility === 'public') return 'Öffentlich';
    if (settings?.visibility === 'unlisted') return 'Ungelistet';
    return 'Öffentlich';
  };
  
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
                  {group.activityLevel && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Activity className="mr-1 h-3 w-3" />
                      {getActivityLevelText(group.activityLevel)}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{group.name}</h1>
                
                <div className="space-y-3 text-sm">
                  {group.locationName && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{group.locationName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{memberCount} {memberCount === 1 ? 'Mitglied' : 'Mitglieder'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Erstellt {formatDistanceToNow(createdAtDate, { addSuffix: true, locale: de })}</span>
                  </div>

                  {group.city && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{[group.city, group.state, group.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Group tags */}
                {group.groupTags && group.groupTags.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {group.groupTags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-gray-50">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Group description */}
                {group.description && (
                  <div className="mt-6 text-gray-600 border-t border-gray-100 pt-5">
                    <p>{group.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Group Membership */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Mitgliedschaft</h2>
                
                {!userId ? (
                  <div className="space-y-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Logge dich ein, um dieser Gruppe beizutreten.
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/auth/signin">
                        Einloggen
                      </Link>
                    </Button>
                  </div>
                ) : isMember ? (
                  <div>
                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Du bist Mitglied</span>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <LeaveGroupButton groupId={group.id} isMember={isMember} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <JoinGroupButton 
                      groupId={group.id} 
                      isPrivate={group.isPrivate} 
                      isMember={isMember}
                    />
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Gruppendetails</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Sichtbarkeit:</span>
                    <Badge variant="outline" className="bg-gray-50">
                      {getVisibilityText()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Beitritt:</span>
                    <Badge variant="outline" className="bg-gray-50">
                      {entryRules?.inviteOnly ? 'Nur mit Einladung' : 
                       entryRules?.requireApproval ? 'Mit Genehmigung' :
                       'Offen'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Aktivitätslevel:</span>
                    <Badge variant="outline" className="bg-gray-50">
                      {getActivityLevelText(group.activityLevel)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Status:</span>
                    <Badge variant="outline" className={`${group.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {group.status === 'active' ? 'Aktiv' : 
                       group.status === 'inactive' ? 'Inaktiv' : 
                       'Archiviert'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Admin Tools Section - Only for owners/admins */}
              {(isOwner || isAdmin) && (
                <div className="border-t border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-900 mb-4">Admin-Tools</h2>
                  
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <Link href={`/groups/${group.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Gruppe bearbeiten
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <Link href={`/groups/${group.id}/settings`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Einstellungen
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <Link href={`/groups/${group.id}/members`}>
                        <Users className="h-4 w-4 mr-2" />
                        Mitglieder verwalten
                      </Link>
                    </Button>

                    {isOwner && group.inviteCode && (
                      <InviteCodeClient inviteCode={group.inviteCode} />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional group info sections could go here */}
          </div>

          {/* Right content area - Tabs with content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Gruppeninhalte</h2>
                
                <div className="flex gap-2">
                  {isMember && settings?.allowMemberPosts && (
                    <Button size="sm" asChild>
                      <Link href={`/groups/${group.id}/posts/create`}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Post erstellen
                      </Link>
                    </Button>
                  )}
                  
                  {(isMember && settings?.allowMemberEvents) || isOwner || isAdmin ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/groups/${group.id}/events/create`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Event planen
                      </Link>
                    </Button>
                  ) : null}
                  
                  <ShareButtonClient groupName={group.name} />
                </div>
              </div>
              
              <Tabs defaultValue="posts" className="w-full">
                <div className="px-5 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="members">Mitglieder</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="posts" className="p-5">
                  {group.posts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-500 mb-4">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Posts</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Diese Gruppe hat noch keine Posts. {isMember && settings?.allowMemberPosts ? "Sei der Erste, der etwas teilt!" : ""}
                      </p>
                      
                      {isMember && settings?.allowMemberPosts && (
                        <Button asChild>
                          <Link href={`/groups/${group.id}/posts/create`}>
                            Ersten Post erstellen
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <GroupPostsList 
                      posts={group.posts} 
                      groupId={group.id}
                      userId={userId}
                      isMember={isMember}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="events" className="p-5">
                  {group.events.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-500 mb-4">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Events</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Diese Gruppe hat noch keine kommenden Events geplant.
                      </p>
                      
                      {((isMember && settings?.allowMemberEvents) || isOwner || isAdmin) && (
                        <Button asChild>
                          <Link href={`/groups/${group.id}/events/create`}>
                            Event planen
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Kommende Events</h3>
                        
                        {((isMember && settings?.allowMemberEvents) || isOwner || isAdmin) && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/groups/${group.id}/events/create`}>
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Event erstellen
                            </Link>
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-4">
                        {group.events.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                      
                      {group.events.length > 0 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" asChild>
                            <Link href={`/groups/${group.id}/events`}>
                              Alle Events anzeigen
                              <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="members" className="p-5">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Gruppenmitglieder ({memberCount})</h3>
                      
                      {(isOwner || isAdmin) && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/groups/${group.id}/members`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Verwalten
                          </Link>
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Owner Card */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {group.owner.image ? (
                            <AvatarImage src={group.owner.image} alt={group.owner.name || 'Group Owner'} />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {group.owner.name?.charAt(0) || 'O'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div>
                          <div className="font-medium text-gray-900">{group.owner.name}</div>
                          <div className="text-xs flex items-center text-blue-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Gruppenersteller
                          </div>
                        </div>
                      </div>
                      
                      {/* Admin Cards */}
                      {group.admins
                        .filter((admin: GroupAdmin) => admin.user.id !== group.ownerId) // Filter out owner
                        .map((admin: GroupAdmin) => (
                          <div key={admin.user.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {admin.user.image ? (
                                <AvatarImage src={admin.user.image} alt={admin.user.name || 'Admin'} />
                              ) : (
                                <AvatarFallback className="bg-gray-100 text-gray-600">
                                  {admin.user.name?.charAt(0) || 'A'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div>
                              <div className="font-medium text-gray-900">{admin.user.name}</div>
                              <div className="text-xs flex items-center text-gray-500">
                                <Shield className="h-3 w-3 mr-1" />
                                Administrator
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {/* Regular Members */}
                      {group.members
                        .filter(member => 
                          member.id !== group.ownerId && 
                          !group.admins.some((admin: GroupAdmin) => admin.user.id === member.id)
                        )
                        .map(member => {
                          // Get member status and anonymity setting
                          const memberStatus = member.groupMemberStatuses?.[0];
                          const isAnonymous = memberStatus?.isAnonymous || false;
                          
                          // Show real profile if:
                          // 1. Member is not anonymous, OR
                          // 2. Current user is the member themselves, OR
                          // 3. Current user is a group admin/owner
                          const shouldHideDetails = isAnonymous && member.id !== userId && !isOwner && !isAdmin;
                          
                          return (
                            <div key={member.id} className="border border-gray-100 rounded-lg p-4 flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {!shouldHideDetails && member.image ? (
                                  <AvatarImage src={member.image} alt={member.name || 'Member'} />
                                ) : (
                                  <AvatarFallback className={shouldHideDetails ? "bg-gray-200" : undefined}>
                                    {!shouldHideDetails ? (member.name?.charAt(0) || 'M') : '?'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-1">
                                  {shouldHideDetails ? 'Anonymes Mitglied' : member.name}
                                  {isAnonymous && !shouldHideDetails && (
                                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 inline-flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                           className="h-3 w-3 mr-0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" x2="22" y1="2" y2="22" />
                                      </svg>
                                      Anonym
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {/* Get role if exists */}
                                  {!shouldHideDetails && (
                                    group.memberRoles.find((mr: GroupMemberRole) => mr.user.id === member.id)?.role.name || 'Mitglied'
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {memberCount > 7 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/groups/${group.id}/members`}>
                            Alle Mitglieder anzeigen
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 