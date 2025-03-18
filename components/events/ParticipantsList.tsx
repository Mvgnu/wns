'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Participant {
  id: string;
  name: string;
  image?: string;
  email?: string;
}

interface ParticipantsListProps {
  eventId: string;
  initialParticipants?: Participant[];
  showAll?: boolean;
}

export default function ParticipantsList({ 
  eventId, 
  initialParticipants = [], 
  showAll = false 
}: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [loading, setLoading] = useState(initialParticipants.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [showAllParticipants, setShowAllParticipants] = useState(showAll);
  
  // Number of participants to show by default
  const defaultShowCount = 6;
  
  // Memoize the fetchParticipants function to prevent recreating it on every render
  const fetchParticipants = useCallback(async () => {
    // Add a cache buster to prevent excessive API calls
    const cacheBuster = new Date().getTime();
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/attendees?_=${cacheBuster}`, {
        // Add cache control headers
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      
      const data = await response.json();
      setParticipants(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Could not load participants');
    } finally {
      setLoading(false);
    }
  }, [eventId]);
  
  // Fetch participants if not provided, with proper dependency tracking
  useEffect(() => {
    if (initialParticipants.length === 0) {
      fetchParticipants();
    }
  }, [fetchParticipants, initialParticipants.length]);
  
  // Memoize displayed participants to prevent unnecessary recalculations
  const displayedParticipants = useMemo(() => 
    showAllParticipants 
      ? participants 
      : participants.slice(0, defaultShowCount),
    [participants, showAllParticipants, defaultShowCount]
  );
  
  // Memoize the show button state
  const showViewMoreButton = useMemo(() => 
    participants.length > defaultShowCount && !showAllParticipants,
    [participants.length, defaultShowCount, showAllParticipants]
  );
  
  if (loading) {
    return <div className="py-4 text-center text-gray-500">Lade Teilnehmer...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }
  
  if (participants.length === 0) {
    return <div className="py-4 text-center text-gray-500">Noch keine Teilnehmer</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedParticipants.map((participant) => (
          <Link 
            key={participant.id} 
            href={`/profile/${participant.id}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Avatar className="h-10 w-10">
              {participant.image ? (
                <img 
                  src={participant.image} 
                  alt={participant.name || 'User'} 
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                  <span className="text-lg font-semibold">
                    {participant.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{participant.name}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {showViewMoreButton && (
        <div className="flex justify-center pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAllParticipants(true)}
          >
            Alle {participants.length} Teilnehmer anzeigen
          </Button>
        </div>
      )}
    </div>
  );
} 