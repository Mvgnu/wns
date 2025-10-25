'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ParticipantsList from '@/components/events/ParticipantsList';
import { Users } from 'lucide-react';

interface EventParticipantsProps {
  eventId: string;
  attendeeCount: number;
}

export default function EventParticipants({ eventId, attendeeCount }: EventParticipantsProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Teilnehmer ({attendeeCount})</h2>
        </div>
        <div className="text-gray-500">
          {expanded ? '▲' : '▼'}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4">
          <ParticipantsList eventId={eventId} />
        </div>
      )}
    </Card>
  );
} 