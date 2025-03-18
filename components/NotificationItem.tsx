"use client";

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EventReminderNotification from './events/EventReminderNotification';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    message: string;
    linkUrl?: string;
    read: boolean;
    createdAt: Date;
    metadata?: string;
  };
  onMarkAsRead: (id: string) => void;
}

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (notification.read) return;
    onMarkAsRead(notification.id);
  };

  // Parse metadata if available
  let metadata: any = null;
  if (notification.metadata) {
    try {
      metadata = JSON.parse(notification.metadata);
    } catch (e) {
      console.error('Error parsing notification metadata:', e);
    }
  }

  // Check if this is an event attendance notification
  const isEventAttendanceQuery = notification.type === 'EVENT_ATTENDANCE_QUERY' && metadata?.requiresAction;

  return (
    <li 
      className={`border-b last:border-b-0 p-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${
        notification.read ? 'opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10'
      }`}
      onClick={handleMarkAsRead}
    >
      {isEventAttendanceQuery ? (
        // Special handling for event attendance notifications
        <EventReminderNotification
          eventId={metadata.eventId}
          eventTitle={metadata.eventTitle}
          timeToEvent={metadata.timeToEvent}
          onClose={() => onMarkAsRead(notification.id)}
        />
      ) : (
        // Standard notification display
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full flex-shrink-0">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            {notification.linkUrl ? (
              <Link 
                href={notification.linkUrl} 
                className="block font-medium text-sm mb-1 hover:underline"
              >
                {notification.message}
              </Link>
            ) : (
              <p className="font-medium text-sm mb-1">{notification.message}</p>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true,
                locale: de
              })}
            </p>
          </div>
          
          {!notification.read && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
          )}
        </div>
      )}
    </li>
  );
} 