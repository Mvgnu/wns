'use client';

import dynamic from 'next/dynamic';
import type { Event } from '@/types/event';

const GroupEventsClient = dynamic(() => import('./GroupEventsClient'), {
  ssr: false,
  loading: () => <div>Loading events...</div>
});

const GroupActions = dynamic(() => import('@/components/groups/GroupActions'), {
  ssr: false,
  loading: () => <div>Loading actions...</div>
});

type GroupClientWrapperProps = {
  type: 'events' | 'actions';
  events?: Event[];
  userId?: string;
  groupId?: string;
  isOwner?: boolean;
};

export default function GroupClientWrapper({ type, events, userId, groupId, isOwner }: GroupClientWrapperProps) {
  if (type === 'events' && events) {
    return <GroupEventsClient events={events} userId={userId} />;
  }

  if (type === 'actions' && groupId && typeof isOwner === 'boolean') {
    return <GroupActions groupId={groupId} isOwner={isOwner} />;
  }

  return null;
} 