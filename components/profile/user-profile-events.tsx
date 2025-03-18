'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

interface EventProps {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  image: string | null;
  location: string | null;
  group?: {
    id: string;
    name: string;
  };
  _count?: {
    attendees: number;
  };
}

interface UserProfileEventsProps {
  userId: string;
}

export default function UserProfileEvents({ userId }: UserProfileEventsProps) {
  const [events, setEvents] = useState<EventProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/events`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  const upcomingEvents = events.filter(event => 
    isAfter(new Date(event.startTime), new Date())
  ).sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const pastEvents = events.filter(event => 
    isBefore(new Date(event.startTime), new Date())
  ).sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const formatDate = (date: Date) => {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Events Yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          This user hasn't created or joined any events yet.
        </p>
        <Button asChild>
          <Link href="/events/new">Create an Event</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastEvents.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="pt-4">
          {upcomingEvents.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="pt-4">
          {pastEvents.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No past events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventCard({ event, isPast = false }: { event: EventProps, isPast?: boolean }) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className={`overflow-hidden h-full hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
        <div className="relative h-32 bg-muted">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-100 to-indigo-100">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {isPast && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Badge variant="secondary" className="uppercase">Past Event</Badge>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-lg mb-2 line-clamp-1">{event.title}</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
              <span>{format(new Date(event.startTime), 'EEE, MMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
              <span>
                {format(new Date(event.startTime), 'h:mm a')}
                {event.endTime && ` - ${format(new Date(event.endTime), 'h:mm a')}`}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event._count && (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-3 w-3 mr-2 flex-shrink-0" />
                <span>{event._count.attendees} {event._count.attendees === 1 ? 'attendee' : 'attendees'}</span>
              </div>
            )}
            
            {event.group && (
              <div className="pt-2 mt-2 border-t text-xs">
                <span className="text-muted-foreground">Group: </span>
                <span className="font-medium">{event.group.name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
} 