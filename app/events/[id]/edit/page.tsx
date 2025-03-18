'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventForm from '@/components/events/EventForm';
import { useEvent } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { useLocations } from '@/hooks/useLocations';
import Link from 'next/link';

export default function EditEventPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Check if user is authorized to edit this event
  useEffect(() => {
    if (!session || !event) return;

    const userIsOrganizer = event.organizerId === session.user?.id;
    const userIsGroupOwner = event.group && session.user?.ownedGroups?.includes(event.group.id);
    const userIsGroupAdmin = event.group && session.user?.adminGroups?.includes(event.group.id);

    setIsAuthorized(userIsOrganizer || userIsGroupOwner || userIsGroupAdmin);
  }, [session, event]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}/edit`);
    }
  }, [status, router, eventId]);

  // Loading state
  if (eventLoading || groupsLoading || locationsLoading || status === 'loading') {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Lade Event-Daten...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (eventError || !event) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6 text-red-600">Fehler beim Laden des Events</h1>
              <p className="mb-4">Das Event konnte nicht geladen werden oder existiert nicht.</p>
              <Button asChild>
                <Link href="/events">Zurück zur Eventübersicht</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authorized
  if (isAuthorized === false) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6 text-red-600">Keine Berechtigung</h1>
              <p className="mb-4">Du hast keine Berechtigung, dieses Event zu bearbeiten.</p>
              <Button asChild>
                <Link href={`/events/${eventId}`}>Zurück zum Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format event data for the form
  const formatEventForForm = () => {
    return {
      id: event.id,
      title: event.title,
      description: event.description || '',
      startTime: event.startTime,
      endTime: event.endTime || undefined,
      locationId: event.locationId || undefined,
      groupId: event.groupId || undefined,
      image: event.image || undefined,
      isRecurring: event.isRecurring || false,
      recurringPattern: event.recurringPattern || undefined,
      recurringDays: event.recurringDays || [],
      recurringEndDate: event.recurringEndDate || undefined,
    };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Event bearbeiten</h1>
            <EventForm 
              initialData={formatEventForForm()}
              isEditing={true}
              groups={groups || []}
              locations={locations || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 