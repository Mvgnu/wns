'use client';

import { User, Event } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';

interface UserProfileStatsProps {
  user: User;
  stats: {
    groups: number;
    events: number;
    posts: number;
    locations: number;
  };
  upcomingEvents: Event[];
}

export default function UserProfileStats({ user, stats, upcomingEvents }: UserProfileStatsProps) {
  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Groups" value={stats.groups} />
            <StatItem label="Events" value={stats.events} />
            <StatItem label="Posts" value={stats.posts} />
            <StatItem label="Locations" value={stats.locations} />
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Events Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
              
              {upcomingEvents.length > 2 && (
                <Button asChild variant="ghost" className="w-full mt-2">
                  <Link href={`/events?userId=${user.id}`} className="flex items-center justify-center">
                    View all events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No upcoming events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for stat items
function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="text-center p-2 rounded-md bg-muted/50">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// Helper component for event items
function EventItem({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`}>
      <div className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
        <h3 className="font-medium">{event.title}</h3>
        
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 mr-2" />
            {format(event.startTime, 'EEEE, MMM d')}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-2" />
            {format(event.startTime, 'h:mm a')}
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-2" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 