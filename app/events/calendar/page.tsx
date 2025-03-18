'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EventCard from '@/components/events/EventCard';
import { 
  format, 
  isToday, 
  isSameMonth, 
  isWeekend,
  addDays, 
  isSameDay, 
  isBefore, 
  isAfter, 
  parseISO, 
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  getDay
} from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { 
  Loader2, 
  CalendarDays, 
  Clock, 
  Users, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EventList from '@/components/events/EventList';
import EventAttendance from '@/components/events/EventAttendance';

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Calculate the start and end dates for the current month view (including adjacent month days shown in calendar)
  const monthStart = React.useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = React.useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const calendarStart = React.useMemo(() => startOfWeek(monthStart, { locale: de }), [monthStart]);
  const calendarEnd = React.useMemo(() => endOfWeek(monthEnd, { locale: de }), [monthEnd]);
  
  // Fetch events for the current calendar view
  const { data: calendarEvents, isLoading: eventsLoading } = useCalendarEvents({
    startDate: calendarStart,
    endDate: calendarEnd
  });
  
  const { data: userGroups } = useGroups();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  
  // Use the pre-filtered events from the calendar API
  const filteredEvents = Array.isArray(calendarEvents) ? calendarEvents : [];
  
  // Generate calendar days for the current month view
  const calendarDays = React.useMemo(() => {
    // Get start and end of the month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Get start and end of the calendar grid (including days from previous/next months)
    const calendarStart = startOfWeek(monthStart, { locale: de });
    const calendarEnd = endOfWeek(monthEnd, { locale: de });
    
    // Generate array of all days in the calendar view
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);
  
  // Create a safe date parsing function
  const safeParseDate = (dateValue: any): Date => {
    try {
      if (typeof dateValue === 'string') {
        return parseISO(dateValue);
      } else if (dateValue instanceof Date) {
        return dateValue;
      } else {
        return new Date(dateValue);
      }
    } catch (e) {
      return new Date(); // Fallback to current date if parsing fails
    }
  };
  
  // Update selected date events when selected date changes
  useEffect(() => {
    if (selectedDate && filteredEvents.length > 0) {
      const eventsOnSelectedDate = filteredEvents.filter(event => {
        const eventDate = safeParseDate(event.startTime);
        return isSameDay(eventDate, selectedDate);
      });
      
      setSelectedDateEvents(eventsOnSelectedDate);
    }
  }, [selectedDate, filteredEvents]);
  
  // Update upcoming events
  useEffect(() => {
    if (filteredEvents.length > 0) {
      const now = new Date();
      const next30Days = addDays(now, 30);
      
      const upcoming = filteredEvents.filter(event => {
        const eventDate = safeParseDate(event.startTime);
        return isAfter(eventDate, now) && isBefore(eventDate, next30Days);
      }).sort((a, b) => {
        const dateA = safeParseDate(a.startTime);
        const dateB = safeParseDate(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      
      setUpcomingEvents(upcoming);
    }
  }, [filteredEvents]);
  
  // Check if a day has events
  const getDayEvents = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = safeParseDate(event.startTime);
      return isSameDay(eventDate, date);
    });
  };
  
  // Handle navigation to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Handle navigation to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle date selection and dialog opening
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };
  
  // Group upcoming events by day
  const eventsByDay = upcomingEvents.reduce((acc: Record<string, any[]>, event) => {
    const eventDay = format(safeParseDate(event.startTime), 'yyyy-MM-dd');
    if (!acc[eventDay]) {
      acc[eventDay] = [];
    }
    acc[eventDay].push(event);
    return acc;
  }, {});
  
  if (!session) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Bitte melde dich an, um den Kalender zu sehen</h1>
        <Button asChild>
          <Link href="/auth/signin?callbackUrl=/events/calendar">Anmelden</Link>
        </Button>
      </div>
    );
  }
  
  if (eventsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Veranstaltungskalender</h1>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h2 className="text-xl font-medium w-48 text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: de })}
          </h2>
          
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          <Button asChild>
            <Link href="/events/create" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Neues Event
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Modern Calendar Grid */}
      <div className="rounded-lg overflow-hidden border border-border mb-8">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 bg-muted">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
            <div key={day} className="py-3 text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-auto">
          {calendarDays.map((day, i) => {
            const dayEvents = getDayEvents(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            
            // Calculate which week row this day belongs to
            const weekRow = Math.floor(i / 7);
            
            return (
              <div
                key={day.toISOString()}
                style={{ gridRow: weekRow + 1, gridColumn: (i % 7) + 1 }}
                className={cn(
                  "min-h-[120px] h-full p-2 border border-border",
                  !isCurrentMonth && "opacity-40 bg-muted/30",
                  isToday(day) && "bg-blue-50",
                  isSelected && "ring-2 ring-primary ring-inset",
                  isWeekend(day) && "bg-gray-50"
                )}
                onClick={() => handleDateSelect(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "inline-flex items-center justify-center h-7 w-7 rounded-full text-sm",
                    isToday(day) && "bg-primary text-white font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <Badge variant="outline" className="bg-primary/10">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>
                
                {/* Preview of events (max 2) */}
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const eventDate = safeParseDate(event.startTime);
                    return (
                      <div 
                        key={event.id}
                        className="text-xs truncate p-1 rounded bg-primary/10 border border-primary/20"
                      >
                        {format(eventDate, 'HH:mm')} {event.title}
                      </div>
                    );
                  })}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 2} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Event Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate || new Date(), 'PPP', { locale: de })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <div key={event.id}>
                  <EventAttendance
                    event={event}
                    userId={session?.user?.id}
                    instanceDate={
                      event.isRecurringInstance ? 
                        new Date(event.instanceDate) : 
                        (event.isRecurring ? 
                          // For regular recurring events, use the selectedDate
                          new Date(selectedDate || new Date()) : 
                          // For one-time events, don't pass instanceDate
                          undefined)
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Keine Events an diesem Tag
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Upcoming Events */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Kommende Events</h2>
        <div className="space-y-4">
          {Object.entries(eventsByDay).map(([day, events]) => (
            <div key={day}>
              <h3 className="text-lg font-semibold mb-2">
                {format(parseISO(day), 'PPP', { locale: de })}
              </h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <EventAttendance
                    key={event.id}
                    event={event}
                    userId={session?.user?.id}
                    instanceDate={
                      event.isRecurringInstance ? 
                        new Date(event.instanceDate) : 
                        (event.isRecurring ? 
                          new Date(parseISO(day)) : 
                          undefined)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(eventsByDay).length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Keine kommenden Events in den nächsten 30 Tagen
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 