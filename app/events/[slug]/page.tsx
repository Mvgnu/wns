'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Share2, Edit, Trash2, Check, X, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventTimeline from '@/components/events/EventTimeline';
import EventDetailClient from './components/EventDetailClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

// Simple loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

interface EventProps {
  params: Promise<{
    id: string;
  }>;
}

type RSVPStatus = "NONE" | "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "CHECKED_IN" | "NO_SHOW";

export default function EventPage({ params }: EventProps) {
  const { id: eventId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState<RSVPStatus>("NONE");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<{ confirmedCount: number; waitlistCount: number; capacity: number | null; isFull: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Event konnte nicht geladen werden');
        }
        
        const data = await response.json();
        setEvent(data);
        if (data.attendanceSummary) {
          setAttendanceSummary(data.attendanceSummary);
          setAttendeeCount(data.attendanceSummary.confirmedCount);
        } else {
          setAttendeeCount(data.attendees?.length ?? 0);
        }

        if (data.attendance) {
          setIsAttending(Boolean(data.attendance.isAttending));
          setAttendanceStatus(data.attendance.status ?? "NONE");
          setIsWaitlisted(Boolean(data.attendance.isWaitlisted));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Event konnte nicht geladen werden');
        setLoading(false);
      }
    }
    
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, session]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-16">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Veranstaltung nicht gefunden</h2>
          <p className="text-gray-600 mb-6">{error || 'Diese Veranstaltung existiert nicht oder wurde gelöscht.'}</p>
          <Button asChild>
            <Link href="/events">Zurück zur Übersicht</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Handle attend button click
  const handleAttendClick = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}`);
      return;
    }

    setIsLoading(true);

    try {
      const method = isAttending ? 'DELETE' : 'POST';
      const res = await fetch(`/api/events/${eventId}/attend`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();

        // Handle specific errors
        if (res.status === 403 && errorData.error?.includes('member of the group')) {
          throw new Error('Sie müssen Mitglied der Gruppe sein, um an dieser Veranstaltung teilzunehmen');
        }

        throw new Error(errorData.error || 'Teilnahmestatus konnte nicht aktualisiert werden');
      }

      const payload = await res.json();

      if (payload.summary) {
        setAttendanceSummary(payload.summary);
        setAttendeeCount(payload.summary.confirmedCount ?? 0);
      }

      if (method === 'POST') {
        const status = (payload.status ?? 'NONE') as RSVPStatus;
        setAttendanceStatus(status);
        const nowAttending = status === 'CONFIRMED' || status === 'CHECKED_IN';
        setIsAttending(nowAttending);
        setIsWaitlisted(status === 'WAITLISTED');
        toast({
          title: nowAttending ? 'Sie nehmen jetzt teil!' : 'Zur Warteliste hinzugefügt',
          description: status === 'WAITLISTED'
            ? 'Sie stehen auf der Warteliste und werden benachrichtigt, sobald ein Platz frei wird.'
            : 'Sie wurden zur Teilnehmerliste hinzugefügt.',
          variant: 'default',
        });
      } else {
        setIsAttending(false);
        setAttendanceStatus('NONE');
        setIsWaitlisted(false);
        toast({
          title: 'Sie nehmen nicht mehr teil',
          description: payload.promotedUserId
            ? 'Sie wurden entfernt und der nächste in der Warteliste wurde informiert.'
            : 'Sie wurden von der Teilnehmerliste entfernt.',
          variant: 'default',
        });
      }

    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Teilnahme:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Teilnahmestatus konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share button click
  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || `Veranstaltung: ${event.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link kopiert',
        description: 'Der Link wurde in die Zwischenablage kopiert',
        variant: 'default',
      });
    }
  };

  const isOrganizer = session?.user?.id === event.organizer.id;
  const eventDate = new Date(event.startTime);
  const eventEndDate = event.endTime ? new Date(event.endTime) : null;
  const isPast = eventDate < new Date();
  
  return (
    <EventDetailClient
      event={{
        ...event,
        attendanceSummary,
      }}
      isAttending={isAttending}
      isWaitlisted={isWaitlisted}
      attendeeCount={attendeeCount}
      attendanceStatus={attendanceStatus}
      onAttendanceToggle={handleAttendClick}
      isLoading={isLoading}
    />
  );
}