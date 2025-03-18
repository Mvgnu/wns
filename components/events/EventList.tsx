"use client";

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
  attendees: {
    id: string;
  }[];
  isRecurring?: boolean;
};

interface EventListProps {
  events: Event[];
  userId?: string;
  showGroupInfo?: boolean;
  groupName?: string;
  groupId?: string;
  instanceDate?: Date;
}

export default function EventList({ 
  events, 
  userId, 
  showGroupInfo = false,
  groupName,
  groupId,
  instanceDate
}: EventListProps) {
  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <EventAttendance
          key={event.id}
          event={event}
          userId={userId}
          showGroupInfo={showGroupInfo}
          groupName={groupName}
          groupId={groupId}
          instanceDate={instanceDate ? new Date(instanceDate) : undefined}
        />
      ))}
    </div>
  );
} 