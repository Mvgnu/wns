"use client";

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, MapPin, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    location?: {
      id: string;
      name: string;
      address?: string;
    };
    group?: {
      id: string;
      name: string;
    };
    _count?: {
      attendees: number;
    };
    attendees?: { id: string }[];
    organizerId?: string;
  };
  showActions?: boolean;
  showDescription?: boolean;
  showAttendees?: boolean;
  className?: string;
}

export default function EventCard({ 
  event, 
  showActions = true, 
  showDescription = true,
  showAttendees = true,
  className = '' 
}: EventCardProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isAttending, setIsAttending] = useState(
    event.attendees?.some(attendee => attendee.id === session?.user?.id) || false
  );

  const handleAttendance = async () => {
    if (!session) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um an Events teilzunehmen.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: isAttending ? 'leave' : 'join',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }

      setIsAttending(!isAttending);
      
      // Invalidate relevant queries to trigger rerender
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      
      toast({
        title: isAttending ? "Teilnahme zurückgezogen" : "Teilnahme bestätigt",
        description: isAttending 
          ? `Du nimmst nicht mehr an "${event.title}" teil.`
          : `Du nimmst jetzt an "${event.title}" teil.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Fehler",
        description: "Deine Teilnahme konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(event.startTime), 'PPP', { locale: de })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {format(new Date(event.startTime), 'HH:mm')}
            {event.endTime && ` - ${format(new Date(event.endTime), 'HH:mm')}`}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <Link href={`/locations/${event.location.id}`} className="hover:underline">
                {event.location.name}
              </Link>
            </div>
          )}
          {showAttendees && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              {event._count?.attendees || 0} Teilnehmer
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      {showDescription && event.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
          </p>
        </CardContent>
      )}
      
      {showActions && (
        <CardFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {event.group && (
              <Badge variant="secondary">
                <Link href={`/groups/${event.group.id}`}>
                  {event.group.name}
                </Link>
              </Badge>
            )}
          </div>
          
          {session && event.organizerId !== session.user.id && (
            <Button
              variant={isAttending ? "destructive" : "default"}
              onClick={handleAttendance}
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird aktualisiert...</>
              ) : isAttending ? (
                'Nicht teilnehmen'
              ) : (
                'Teilnehmen'
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 