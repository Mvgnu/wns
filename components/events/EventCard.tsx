"use client";

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  MapPin, 
  Loader2, 
  RefreshCw, 
  Lock, 
  LockOpen, 
  DollarSign,
  Building,
  Users2
} from 'lucide-react';
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
    isRecurring?: boolean;
    recurringPattern?: string;
    recurringDays?: number[];
    recurringEndDate?: string;
    isPaid?: boolean;
    price?: number;
    priceCurrency?: string;
    priceDescription?: string;
    joinRestriction?: string;
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
      pricingTiers?: number;
      discountCodes?: number;
    };
    attendees?: { id: string }[];
    organizerId?: string;
    maxAttendees?: number;
    isSoldOut?: boolean;
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

    // Check for group-only restriction
    if (event.joinRestriction === 'groupOnly' && !isAttending) {
      if (!event.group) {
        toast({
          title: "Teilnahme nicht möglich",
          description: "Diese Veranstaltung ist nur für Gruppenmitglieder zugänglich.",
          variant: "destructive",
        });
        return;
      }

      // We should check if the user is a member of the group
      // For now, we'll allow the API to handle this check
    }

    // Check if the event is sold out
    if (event.isSoldOut && !isAttending) {
      toast({
        title: "Ausverkauft",
        description: "Diese Veranstaltung ist leider bereits ausverkauft.",
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attendance');
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
        description: error instanceof Error ? error.message : "Deine Teilnahme konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format price
  const formatPrice = () => {
    if (!event.isPaid || !event.price) return null;
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: event.priceCurrency || 'EUR',
      minimumFractionDigits: 2
    }).format(event.price);
  };
  
  // Get access badge variant and text
  const getAccessBadge = () => {
    if (event.joinRestriction === 'groupOnly') {
      return { icon: <Lock className="h-3 w-3 mr-1" />, text: 'Nur Gruppe', variant: 'outline' as const };
    } else if (event.joinRestriction === 'inviteOnly') {
      return { icon: <Lock className="h-3 w-3 mr-1" />, text: 'Nur mit Einladung', variant: 'outline' as const };
    } else {
      return { icon: <LockOpen className="h-3 w-3 mr-1" />, text: 'Öffentlich', variant: 'secondary' as const };
    }
  };

  const accessBadge = getAccessBadge();

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="line-clamp-2">
            <Link href={`/events/${event.id}`} className="hover:underline">
              {event.title}
            </Link>
          </CardTitle>
          
          <div className="flex gap-1">
            {event.isRecurring && (
              <Badge variant="secondary" className="ml-auto">
                <RefreshCw className="h-3 w-3 mr-1" /> Wiederkehrend
              </Badge>
            )}
            {event.isPaid && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <DollarSign className="h-3 w-3 mr-1" /> {formatPrice()}
              </Badge>
            )}
          </div>
        </div>
        
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
              {event.maxAttendees && ` / ${event.maxAttendees}`}
              {event.isSoldOut && " (Ausverkauft)"}
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
        <CardFooter className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex gap-2">
            <Badge variant={accessBadge.variant} className="flex items-center">
              {accessBadge.icon}
              {accessBadge.text}
            </Badge>
            
            {event.group && (
              <Badge variant="secondary" className="flex items-center">
                <Users2 className="h-3 w-3 mr-1" />
                <Link href={`/groups/${event.group.id}`} className="hover:underline">
                  {event.group.name}
                </Link>
              </Badge>
            )}
            
            {event.location && !event.group && (
              <Badge variant="secondary" className="flex items-center">
                <Building className="h-3 w-3 mr-1" />
                <Link href={`/locations/${event.location.id}`} className="hover:underline">
                  {event.location.name}
                </Link>
              </Badge>
            )}
          </div>
          
          {session && event.organizerId !== session.user.id && (
            <Button
              variant={isAttending ? "destructive" : "default"}
              onClick={handleAttendance}
              disabled={isLoading || (event.isSoldOut && !isAttending)}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird aktualisiert...</>
              ) : isAttending ? (
                'Nicht teilnehmen'
              ) : event.isSoldOut ? (
                'Ausverkauft'
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