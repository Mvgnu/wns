'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import EventCard from '@/components/events/EventCard';
import EventAttendance from '@/components/events/EventAttendance';

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
        const isOrganizer = userId === event.organizer.id;
        
        // Format the event object to match EventAttendance Event type
        const formattedEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          image: event.image,
          startTime: typeof event.startTime === 'string' ? event.startTime : new Date(event.startTime),
          endTime: event.endTime ? (typeof event.endTime === 'string' ? event.endTime : new Date(event.endTime)) : null,
          locationName: event.locationName,
          locationId: event.locationId,
          organizer: event.organizer,
          attendees: attendees,
          isRecurring: false // Assuming group events are not recurring
        };
        
        return (
          <EventAttendance
            key={event.id}
            event={formattedEvent}
            userId={userId}
            instanceDate={undefined}
          />
        );
      })}
    </div>
  );
} 