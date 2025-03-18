'use client';

import { useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';

interface CreateEventFormProps {
  groups: Array<{
    id: string;
    name: string;
    isPrivate?: boolean;
  }>;
  locations: Array<{
    id: string;
    name: string;
    address?: string | null;
    sport?: string;
  }>;
  preselectedGroupId?: string;
  preselectedLocationId?: string;
  userId: string;
}

export default function CreateEventForm({
  groups,
  locations,
  preselectedGroupId,
  preselectedLocationId,
  userId
}: CreateEventFormProps) {
  const router = useRouter();

  return (
    <EventForm 
      groups={groups} 
      locations={locations}
      preselectedGroupId={preselectedGroupId}
      preselectedLocationId={preselectedLocationId}
    />
  );
} 