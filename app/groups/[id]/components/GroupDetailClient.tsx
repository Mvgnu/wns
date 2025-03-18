"use client";

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Lock, 
  Calendar, 
  MessageSquare, 
  MapPin, 
  ChevronRight, 
  Share2, 
  Pencil, 
  UserPlus, 
  LogOut, 
  Settings, 
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import JoinGroupButton from '@/components/groups/JoinGroupButton';
import LeaveGroupButton from '@/components/groups/LeaveGroupButton';
import { toast } from '@/components/ui/use-toast';

interface Group {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  locationName: string | null;
  createdAt: Date;
  isPrivate: boolean;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  isOwner: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  comments: { id: string }[];
  likes: { id: string }[];
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  image: string | null;
  organizer: {
    id: string;
    name: string | null;
  };
  attendees: { id: string }[];
  locationName: string | null;
  locationId: string | null;
}

interface GroupDetailClientProps {
  group: Group;
  events: Event[];
  posts: Post[];
  members: Member[];
  isOwner: boolean;
  isMember: boolean;
  userId?: string;
  sportLabel: string;
}

export default function GroupDetailClient({
  group,
  events,
  posts,
  members,
  isOwner,
  isMember,
  userId,
  sportLabel
}: GroupDetailClientProps) {
  const [activeTab, setActiveTab] = useState('events');
  
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: group.description || `Join our ${sportLabel} group!`,
          url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link kopiert!",
        description: "Teile den Link mit Freunden",
      });
    }
  };
  
  const upcomingEvents = events.filter(event => 
    new Date(event.startTime) > new Date()
  ).sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  return (
    <div className="relative overflow-hidden min-h-screen pb-16">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Group Image */}
        <div className="relative rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10"></div>
          
          {group.image ? (
            <div className="w-full h-64 md:h-80">
              <img
                src={group.image}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-64 md:h-80 bg-gradient-to-r from-indigo-600 to-blue-700 flex items-center justify-center">
              <span className="text-8xl font-bold text-white/30">{group.name.charAt(0)}</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge className="bg-indigo-500 border-none hover:bg-indigo-600">
                {sportLabel}
              </Badge>
              
              {group.isPrivate && (
                <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30">
                  <Lock className="h-3 w-3 mr-1" />
                  Private Gruppe
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{group.name}</h1>
            
            {group.locationName && (
              <div className="flex items-center text-white/80 text-sm mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{group.locationName}</span>
              </div>
            )}
            
            <div className="flex items-center text-white/80 text-sm">
              <Users className="h-4 w-4 mr-2" />
              <span>{members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}</span>
              <span className="mx-2">•</span>
              <span>Gegründet {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: de })}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Group Description */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Über diese Gruppe</CardTitle>
              </CardHeader>
              <CardContent>
                {group.description ? (
                  <p className="text-gray-700 whitespace-pre-line">{group.description}</p>
                ) : (
                  <p className="text-gray-500 italic">Keine Beschreibung vorhanden.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-gray-100 p-1">
                  <TabsTrigger 
                    value="events" 
                    className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger 
                    value="posts" 
                    className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Beiträge
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members" 
                    className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Mitglieder
                  </TabsTrigger>
                </TabsList>
                
                {/* Action Buttons based on active tab */}
                {isMember && activeTab === "events" && (
                  <Button size="sm" asChild>
                    <Link href={`/events/create?groupId=${group.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Event erstellen
                    </Link>
                  </Button>
                )}
                
                {isMember && activeTab === "posts" && (
                  <Button size="sm" asChild>
                    <Link href={`/groups/${group.id}/posts/create`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Beitrag erstellen
                    </Link>
                  </Button>
                )}
              </div>
              
              <TabsContent value="events" className="mt-0">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map(event => (
                      <Card key={event.id} className="border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 bg-gray-100 relative">
                            {event.image ? (
                              <img 
                                src={event.image} 
                                alt={event.title} 
                                className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-48 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-500">
                                <Calendar className="h-12 w-12 opacity-40" />
                              </div>
                            )}
                            {event.startTime && (
                              <div className="absolute top-2 left-2 bg-white p-2 rounded-lg shadow-sm text-center min-w-[60px]">
                                <p className="text-xs text-gray-500 uppercase">
                                  {format(new Date(event.startTime), 'MMM', { locale: de })}
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                  {format(new Date(event.startTime), 'd')}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-5 md:w-2/3 flex flex-col">
                            <div className="mb-2">
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">{event.title}</h3>
                              {event.startTime && (
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-indigo-500" />
                                  {format(new Date(event.startTime), 'EEEE, d. MMMM y, HH:mm', { locale: de })} Uhr
                                </p>
                              )}
                              {event.locationName && (
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <MapPin className="h-4 w-4 mr-1 text-indigo-500" />
                                  {event.locationName}
                                </p>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                            )}
                            
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex -space-x-2">
                                  {event.attendees.slice(0, 3).map((attendee, i) => (
                                    <Avatar key={i} className="h-7 w-7 border-2 border-white">
                                      <AvatarImage src="/placeholder-user.jpg" />
                                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                        {i + 1}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {event.attendees.length > 3 && (
                                    <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                                      +{event.attendees.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500 ml-2">
                                  {event.attendees.length} {event.attendees.length === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                                </span>
                              </div>
                              
                              <Button variant="outline" size="sm" className="group-hover:bg-indigo-50 group-hover:text-indigo-600" asChild>
                                <Link href={`/events/${event.id}`}>
                                  Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-4">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Events geplant</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Es sind aktuell keine zukünftigen Events für diese Gruppe geplant.
                    </p>
                    {isMember && (
                      <Button asChild>
                        <Link href={`/events/create?groupId=${group.id}`}>
                          Erstes Event erstellen
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="posts" className="mt-0">
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <Card key={post.id} className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar>
                              <AvatarImage src={post.author.image || ''} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                {post.author.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{post.author.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: de })}
                              </p>
                            </div>
                          </div>
                          <CardTitle className="text-xl">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between text-sm text-gray-500 pt-0">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {post.comments.length} {post.comments.length === 1 ? 'Kommentar' : 'Kommentare'}
                            </span>
                            <span className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                />
                              </svg>
                              {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/groups/${group.id}/posts/${post.id}`}>
                              Ansehen
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-4">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Beiträge</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      In dieser Gruppe wurden noch keine Beiträge veröffentlicht.
                    </p>
                    {isMember && (
                      <Button asChild>
                        <Link href={`/groups/${group.id}/posts/create`}>
                          Ersten Beitrag erstellen
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="members" className="mt-0">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Mitglieder ({members.length})</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.image || ''} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">
                            {member.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name || 'Anonymous'}</p>
                          {member.isOwner && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              Gruppen-Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Aktionen</h3>
              <div className="space-y-3">
                {userId ? (
                  <>
                    {!isMember && (
                      <JoinGroupButton groupId={group.id} isPrivate={group.isPrivate} isMember={isMember} />
                    )}
                    
                    {isMember && !isOwner && (
                      <LeaveGroupButton groupId={group.id} isMember={isMember} />
                    )}
                    
                    {isOwner && (
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href={`/groups/${group.id}/edit`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Gruppe verwalten
                        </Link>
                      </Button>
                    )}
                    
                    <Button className="w-full justify-start" variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Gruppe teilen
                    </Button>
                    
                    {isMember && (
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href={`/events/create?groupId=${group.id}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Event erstellen
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/auth/signin">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Anmelden um beizutreten
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Group Owner Info */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gruppenadmin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={group.owner.image || ''} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      {group.owner.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{group.owner.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">Gruppenadmin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Groups (Placeholder for future enhancement) */}
            <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sport-Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Entdecke weitere Gruppen und Events in deiner Sportart.
                </p>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/groups?sport=${group.sport}`}>
                    Mehr {sportLabel} Gruppen finden
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 