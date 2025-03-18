"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Check, X, HelpCircle } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  startTime: Date | string;
  endTime?: Date | string | null;
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

interface EventAttendanceProps {
  event: Event;
  userId?: string;
  showGroupInfo?: boolean;
  groupName?: string;
  groupId?: string;
  instanceDate?: Date;
}

export default function EventAttendance({ 
  event, 
  userId, 
  showGroupInfo = false,
  groupName,
  groupId,
  instanceDate
}: EventAttendanceProps) {
  // Add state for instance-specific attendance
  const [instanceAttendanceStatus, setInstanceAttendanceStatus] = useState<'yes' | 'no' | 'maybe' | null>(null);
  
  // For regular events, check if the current user is attending this event
  const [isAttending, setIsAttending] = useState(
    userId ? event.attendees.some(attendee => attendee.id === userId) : false
  );
  const [attendeeCount, setAttendeeCount] = useState(event.attendees.length);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if the current user is the organizer
  const isOrganizer = userId === event.organizer.id;

  // Fetch instance-specific attendance status if instanceDate is provided
  useEffect(() => {
    if (instanceDate && userId && event.isRecurring === true) {
      fetchInstanceAttendance();
    }
  }, [instanceDate, userId, event.id]);

  const fetchInstanceAttendance = async () => {
    if (!instanceDate || !userId) return;
    
    try {
      const response = await fetch(
        `/api/events/participation/instance?eventId=${event.id}&date=${instanceDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.userResponse) {
          setInstanceAttendanceStatus(data.userResponse.response);
        }
      }
    } catch (error) {
      console.error('Error fetching instance attendance:', error);
    }
  };
  
  const handleAttend = async () => {
    if (!userId) {
      toast({
        title: "Nicht angemeldet",
        description: "Du musst angemeldet sein, um an Veranstaltungen teilzunehmen",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If this is a recurring event instance, use the instance-specific API
      if (instanceDate && event.isRecurring === true) {
        const payload = {
          eventId: event.id,
          response: 'yes',
          date: instanceDate.toISOString(),
        };
        
        const res = await fetch('/api/events/participation/instance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
        
        setInstanceAttendanceStatus('yes');
        
        toast({
          title: 'Du nimmst jetzt teil!',
          description: `Du wurdest zur Teilnehmerliste für ${instanceDate.toLocaleDateString()} hinzugefügt`,
          variant: 'default',
        });
      } else {
        // For regular events, use the existing attendance API
        const res = await fetch(`/api/events/${event.id}/attend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
        
        setIsAttending(true);
        setAttendeeCount(prev => prev + 1);
        
        toast({
          title: 'Du nimmst jetzt teil!',
          description: 'Du wurdest zur Teilnehmerliste hinzugefügt',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Teilnahme:', error);
      toast({
        title: 'Fehler',
        description: 'Teilnahmestatus konnte nicht aktualisiert werden',
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
      // If this is a recurring event instance, use the instance-specific API
      if (instanceDate && event.isRecurring === true) {
        const payload = {
          eventId: event.id,
          response: 'no',
          date: instanceDate.toISOString(),
        };
        
        const res = await fetch('/api/events/participation/instance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
        
        setInstanceAttendanceStatus('no');
        
        toast({
          title: 'Du nimmst nicht mehr teil',
          description: `Du wurdest von der Teilnehmerliste für ${instanceDate.toLocaleDateString()} entfernt`,
          variant: 'default',
        });
      } else {
        // For regular events, use the existing attendance API
        const res = await fetch(`/api/events/${event.id}/attend`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
        
        setIsAttending(false);
        setAttendeeCount(prev => prev - 1);
        
        toast({
          title: 'Du nimmst nicht mehr teil',
          description: 'Du wurdest von der Teilnehmerliste entfernt',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Teilnahme:', error);
      toast({
        title: 'Fehler',
        description: 'Teilnahmestatus konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // For recurring event instances, handle "maybe" response
  const handleMaybeAttend = async () => {
    if (!userId || !instanceDate || event.isRecurring !== true) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        eventId: event.id,
        response: 'maybe',
        date: instanceDate.toISOString(),
      };
      
      const res = await fetch('/api/events/participation/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
      
      setInstanceAttendanceStatus('maybe');
      
      toast({
        title: 'Teilnahme aktualisiert',
        description: `Du hast mit "Vielleicht" für ${instanceDate.toLocaleDateString()} geantwortet`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Teilnahme:', error);
      toast({
        title: 'Fehler',
        description: 'Teilnahmestatus konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Instance-specific attendance functions
  const handleInstanceAttendance = async (response: 'yes' | 'no' | 'maybe') => {
    if (!userId || !instanceDate) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/events/participation/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          date: instanceDate.toISOString(),
          response: response
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update attendance status');
      }
      
      // Update local state
      setInstanceAttendanceStatus(response);
      
      toast({
        title: 'Teilnahmestatus aktualisiert',
        description: response === 'yes' 
          ? 'Du nimmst an dieser Veranstaltung teil' 
          : response === 'no'
            ? 'Du nimmst nicht an dieser Veranstaltung teil'
            : 'Du nimmst vielleicht an dieser Veranstaltung teil',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Teilnahmestatus konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div>
      {/* If it's a recurring event instance, show instance-specific attendance controls */}
      {instanceDate && event.isRecurring === true ? (
        <div className="mb-3 flex flex-col border border-muted p-4 rounded-md">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <div className="text-sm text-muted-foreground mb-4">
              {instanceDate.toLocaleDateString()} {instanceDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {event.description && (
              <p className="text-sm mb-4">{event.description}</p>
            )}
          </div>
          
          <div className="text-sm font-medium mb-2">
            Deine Teilnahme:
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant={instanceAttendanceStatus === 'yes' ? 'default' : 'outline'}
              onClick={() => handleInstanceAttendance('yes')}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Ja
            </Button>
            <Button 
              size="sm" 
              variant={instanceAttendanceStatus === 'no' ? 'default' : 'outline'}
              onClick={() => handleInstanceAttendance('no')}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Nein
            </Button>
            <Button 
              size="sm" 
              variant={instanceAttendanceStatus === 'maybe' ? 'default' : 'outline'}
              onClick={() => handleInstanceAttendance('maybe')}
              disabled={isLoading}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Vielleicht
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-muted p-4 rounded-md">
          <div className="flex flex-col mb-4">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <div className="text-sm text-muted-foreground mb-2">
              {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {event.description && (
              <p className="text-sm">{event.description}</p>
            )}
          </div>
          
          {userId && !isOrganizer && (
            <div className="flex space-x-2 mt-4">
              {!isAttending ? (
                <Button 
                  size="sm"
                  variant="default"
                  onClick={handleAttend}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Teilnehmen
                </Button>
              ) : (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleLeave}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Nicht teilnehmen
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 