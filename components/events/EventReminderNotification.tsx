"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface EventReminderNotificationProps {
  eventId: string;
  eventTitle: string;
  timeToEvent: string; // e.g., "24 hours"
  onClose?: () => void;
}

export default function EventReminderNotification({
  eventId,
  eventTitle,
  timeToEvent,
  onClose
}: EventReminderNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAttendance = async (response: 'yes' | 'no') => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/events/participation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          response
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update attendance');
      
      toast({
        title: response === 'yes' ? 'Teilnahme bestätigt!' : 'Teilnahme abgelehnt',
        description: response === 'yes' 
          ? `Du wirst an der Veranstaltung "${eventTitle}" teilnehmen.` 
          : `Du wirst nicht an der Veranstaltung "${eventTitle}" teilnehmen.`,
        variant: 'default',
      });
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Fehler',
        description: 'Deine Teilnahme konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="rounded-lg border border-border p-4 shadow-sm bg-card">
      <div className="mb-3">
        <h3 className="font-semibold">Erinnerung: Veranstaltungsteilnahme</h3>
        <p className="text-sm text-muted-foreground">
          Die Veranstaltung "{eventTitle}" findet in {timeToEvent} statt. Wirst du teilnehmen?
        </p>
      </div>
      <div className="flex space-x-2">
        <Button 
          onClick={() => handleAttendance('yes')} 
          disabled={isLoading}
          size="sm" 
          className="flex-1"
        >
          <Check className="mr-1 h-4 w-4" />
          Ja, ich nehme teil
        </Button>
        <Button 
          onClick={() => handleAttendance('no')} 
          disabled={isLoading}
          size="sm" 
          variant="outline" 
          className="flex-1"
        >
          <X className="mr-1 h-4 w-4" />
          Nein, ich kann nicht
        </Button>
      </div>
    </div>
  );
} 