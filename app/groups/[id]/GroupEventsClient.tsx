'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import EventCard from '@/components/events/EventCard';

type Event = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  startTime: Date;
  endTime?: Date | null;
  locationName?: string | null;
  locationId?: string | null;
  organizer: {
    id: string;
    name: string | null;
  };
  attendees?: {
    id: string;
  }[];
};

type GroupEventsClientProps = {
  events: Event[];
  userId: string | undefined;
};

export default function GroupEventsClient({ events, userId }: GroupEventsClientProps) {
  // If there are no events, show a message and a button to create a new event
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-muted/40 rounded-lg border border-border p-6">
        <p className="text-muted-foreground text-center">No events available</p>
        {userId && (
          <a href={`/events/create`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Create an Event
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        // Ensure attendees exists and is an array
        const attendees = event.attendees || [];
        const [isAttending, setIsAttending] = useState(
          userId ? attendees.some(attendee => attendee.id === userId) : false
        );
        const [attendeeCount, setAttendeeCount] = useState(attendees.length);
        const [isLoading, setIsLoading] = useState(false);
        
        const isOrganizer = userId === event.organizer.id;
        
        // Format the event object to match EventCard props
        const formattedEvent = {
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          startTime: typeof event.startTime === 'string' ? event.startTime : new Date(event.startTime).toISOString(),
          endTime: event.endTime ? (typeof event.endTime === 'string' ? event.endTime : new Date(event.endTime).toISOString()) : undefined,
          location: event.locationName ? {
            id: event.locationId || 'unknown',
            name: event.locationName,
          } : undefined,
          attendees: attendees,
          organizerId: event.organizer.id,
          _count: {
            attendees: attendeeCount
          }
        };
        
        const handleAttend = async () => {
          if (!userId) {
            toast({
              title: "Not logged in",
              description: "You must be logged in to attend events",
              variant: "destructive",
            });
            return;
          }
          
          setIsLoading(true);
          
          try {
            const res = await fetch(`/api/events/${event.id}/attend`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!res.ok) throw new Error('Failed to update attendance status');
            
            setIsAttending(true);
            setAttendeeCount(prev => prev + 1);
            
            toast({
              title: 'You are now attending!',
              description: 'You have been added to the attendee list',
              variant: 'default',
            });
          } catch (error) {
            console.error('Error updating attendance:', error);
            toast({
              title: 'Error',
              description: 'Failed to update attendance status',
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
          }
        };
        
        const handleLeave = async () => {
          if (!userId) return;
          
          setIsLoading(true);
          
          try {
            const res = await fetch(`/api/events/${event.id}/attend`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!res.ok) throw new Error('Failed to update attendance status');
            
            setIsAttending(false);
            setAttendeeCount(prev => prev - 1);
            
            toast({
              title: 'You are no longer attending',
              description: 'You have been removed from the attendee list',
              variant: 'default',
            });
          } catch (error) {
            console.error('Error updating attendance:', error);
            toast({
              title: 'Error',
              description: 'Failed to update attendance status',
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
          }
        };
        
        return (
          <EventCard
            key={event.id}
            event={formattedEvent}
            showActions={true}
            showDescription={true}
            showAttendees={true}
          />
        );
      })}
    </div>
  );
} 