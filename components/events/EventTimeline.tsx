"use client";

import { useState, useEffect } from 'react';
import { format, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EventInstance {
  date: Date;
  response?: 'yes' | 'no' | 'maybe';
  attendeeCount?: number;
}

interface EventTimelineProps {
  eventId: string;
  title: string;
  startTime: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringDays?: number[];
  recurringEndDate?: Date;
}

export default function EventTimeline({ 
  eventId, 
  title, 
  startTime,
  isRecurring,
  recurringPattern,
  recurringDays,
  recurringEndDate 
}: EventTimelineProps) {
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  // Generate or fetch upcoming event instances
  useEffect(() => {
    if (isRecurring) {
      fetchOrGenerateInstances();
    } else {
      // For non-recurring events, just show the single instance
      fetchSingleEventResponse();
    }
  }, [eventId, isRecurring]);

  const fetchSingleEventResponse = async () => {
    try {
      setLoading(true);
      // Use a more reliable endpoint for single events
      const response = await fetch(`/api/events/${eventId}/attend`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Set the instance with the current attendance status
        setInstances([
          {
            date: new Date(startTime),
            response: data.isAttending ? 'yes' : 'no',
            attendeeCount: data.attendeeCount || 0,
          }
        ]);
      } else {
        // If there's an error or the user is not logged in, just show the date
        setInstances([{ date: new Date(startTime) }]);
      }
    } catch (error) {
      console.error('Error fetching event response:', error);
      // On error, just show the date
      setInstances([{ date: new Date(startTime) }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrGenerateInstances = async () => {
    setLoading(true);
    
    // Generate the next 10 instances based on pattern
    const nextInstances = generateNextInstances(10);
    
    // For each instance, fetch attendance data if available
    try {
      const instancesWithData = await Promise.all(
        nextInstances.map(async (instance) => {
          try {
            // Try to fetch attendance data for this instance date
            const response = await fetch(`/api/events/participation/instance?eventId=${eventId}&date=${instance.date.toISOString()}`);
            if (response.ok) {
              const data = await response.json();
              return {
                ...instance,
                response: data.userResponse?.response,
                attendeeCount: data.counts?.yes || 0,
              };
            }
            return instance;
          } catch {
            return instance;
          }
        })
      );
      
      setInstances(instancesWithData);
    } catch (error) {
      console.error('Error fetching event instances:', error);
      setInstances(nextInstances);
    } finally {
      setLoading(false);
    }
  };

  const generateNextInstances = (count: number): EventInstance[] => {
    if (!isRecurring || !recurringPattern) {
      return [{ date: new Date(startTime) }];
    }

    const instances: EventInstance[] = [];
    let currentDate = new Date(startTime);
    
    // Generate instances based on pattern
    for (let i = 0; i < count; i++) {
      if (recurringEndDate && currentDate > recurringEndDate) {
        break;
      }
      
      switch (recurringPattern) {
        case 'daily':
          instances.push({ date: new Date(currentDate) });
          currentDate = addDays(currentDate, 1);
          break;
          
        case 'weekly':
          if (recurringDays && recurringDays.length > 0) {
            // For each day of the week in recurringDays
            for (const day of recurringDays.sort()) {
              // Skip past days in the first week
              if (i === 0 && day < currentDate.getDay()) continue;
              
              // Create instance for this day
              const dayDiff = day - currentDate.getDay();
              const instanceDate = addDays(currentDate, dayDiff);
              
              if (recurringEndDate && instanceDate > recurringEndDate) {
                break;
              }
              
              instances.push({ date: instanceDate });
            }
            
            // Move to next week
            currentDate = addWeeks(currentDate, 1);
            // Reset to beginning of week
            currentDate.setDate(currentDate.getDate() - currentDate.getDay());
          } else {
            // Just weekly on the same day
            instances.push({ date: new Date(currentDate) });
            currentDate = addWeeks(currentDate, 1);
          }
          break;
          
        case 'monthly':
          if (recurringDays && recurringDays.length === 2) {
            // This is "nth day of week" format (e.g. 3rd Tuesday)
            const occurrence = recurringDays[0]; // 1-4 for 1st to 4th
            const dayOfWeek = recurringDays[1]; // 0-6 for Sun-Sat
            
            // Find the next occurrence
            const nextDate = findNthDayOfMonth(
              currentDate.getMonth(),
              currentDate.getFullYear(),
              dayOfWeek,
              occurrence
            );
            
            if (recurringEndDate && nextDate > recurringEndDate) {
              break;
            }
            
            instances.push({ date: nextDate });
            currentDate = addMonths(currentDate, 1);
          } else if (recurringDays && recurringDays.length > 0) {
            // Multiple days of month
            for (const day of recurringDays.sort()) {
              const instanceDate = new Date(currentDate);
              instanceDate.setDate(day);
              
              // Skip days that have already passed in current month
              if (i === 0 && instanceDate < new Date()) continue;
              
              if (recurringEndDate && instanceDate > recurringEndDate) {
                break;
              }
              
              instances.push({ date: instanceDate });
            }
            
            // Move to next month
            currentDate = addMonths(currentDate, 1);
            currentDate.setDate(1); // Reset to beginning of month
          } else {
            // Just monthly on the same day
            instances.push({ date: new Date(currentDate) });
            currentDate = addMonths(currentDate, 1);
          }
          break;
          
        default:
          instances.push({ date: new Date(currentDate) });
          currentDate = addMonths(currentDate, 1);
      }
      
      // Check if we have enough instances
      if (instances.length >= count) break;
    }
    
    // Return only the requested number of instances
    return instances.slice(0, count);
  };

  // Helper function to find the nth occurrence of a day in a month
  const findNthDayOfMonth = (month: number, year: number, dayOfWeek: number, n: number): Date => {
    const date = new Date(year, month, 1);
    
    // Find the first occurrence of the day
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }
    
    // Add (n-1) weeks to get to the nth occurrence
    date.setDate(date.getDate() + (n - 1) * 7);
    
    return date;
  };

  const handleAttendanceChange = async (instanceDate: Date, response: 'yes' | 'no' | 'maybe') => {
    try {
      // For all events, use the instance-specific API
      const payload = {
        eventId,
        response,
        date: instanceDate.toISOString(),
      };
      
      const apiResponse = await fetch('/api/events/participation/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // Better error handling
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Teilnahmestatus konnte nicht aktualisiert werden');
      }
      
      // Get updated attendance counts after the update
      const updatedCountsResponse = await fetch(`/api/events/participation/instance?eventId=${eventId}&date=${instanceDate.toISOString()}`);
      
      if (!updatedCountsResponse.ok) {
        console.error('Failed to fetch updated attendance counts');
      } else {
        const countsData = await updatedCountsResponse.json();
        
        // Update local state to reflect the attendance change and updated attendee count
        setInstances(prevInstances => 
          prevInstances.map(instance => 
            isSameDay(instance.date, instanceDate) 
              ? { 
                  ...instance, 
                  response,
                  attendeeCount: countsData.counts?.yes || 0
                } 
              : instance
          )
        );
      }
      
      // Show appropriate toast notification based on response
      toast({
        title: 'Teilnahme aktualisiert',
        description: `Du hast mit "${response === 'yes' ? 'Ja' : response === 'no' ? 'Nein' : 'Vielleicht'}" geantwortet`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Deine Teilnahme konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
  };

  // Filter instances based on active tab
  const filteredInstances = instances.filter(instance => {
    const now = new Date();
    if (activeTab === 'upcoming') {
      return instance.date >= now;
    } else {
      return instance.date < now;
    }
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Terminplan</h3>
      
      {isRecurring && (
        <div className="text-sm text-muted-foreground mb-4">
          {recurringPattern === 'daily' && 'Täglich'}
          {recurringPattern === 'weekly' && 'Wöchentlich'}
          {recurringPattern === 'monthly' && 'Monatlich'}
          {recurringEndDate && ` bis ${format(recurringEndDate, 'dd.MM.yyyy')}`}
        </div>
      )}
      
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Kommende Termine</TabsTrigger>
          <TabsTrigger value="past">Vergangene Termine</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="pt-4">
          {loading ? (
            <div className="text-center py-4">Lädt...</div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Keine kommenden Termine</div>
          ) : (
            <div className="space-y-3">
              {filteredInstances.map((instance, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr]">
                      <div className="bg-primary text-primary-foreground p-3 flex flex-col items-center justify-center">
                        <Calendar className="h-5 w-5 mb-1" />
                        <div className="text-lg font-semibold">
                          {format(instance.date, 'dd.MM', { locale: de })}
                        </div>
                        <div className="text-xs">
                          {format(instance.date, 'EEEE', { locale: de })}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Clock className="h-4 w-4 inline-block mr-1" />
                            <span className="text-sm">
                              {format(instance.date, 'HH:mm', { locale: de })} Uhr
                            </span>
                          </div>
                          
                          {instance.attendeeCount !== undefined && (
                            <Badge variant="outline">
                              {instance.attendeeCount} {instance.attendeeCount === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            variant={instance.response === 'yes' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(instance.date, 'yes')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Ja
                          </Button>
                          <Button 
                            size="sm" 
                            variant={instance.response === 'no' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(instance.date, 'no')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Nein
                          </Button>
                          <Button 
                            size="sm" 
                            variant={instance.response === 'maybe' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(instance.date, 'maybe')}
                          >
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Vielleicht
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="pt-4">
          {loading ? (
            <div className="text-center py-4">Lädt...</div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Keine vergangenen Termine</div>
          ) : (
            <div className="space-y-3">
              {filteredInstances.map((instance, index) => (
                <Card key={index} className="overflow-hidden opacity-75">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr]">
                      <div className="bg-muted p-3 flex flex-col items-center justify-center">
                        <Calendar className="h-5 w-5 mb-1" />
                        <div className="text-lg font-semibold">
                          {format(instance.date, 'dd.MM', { locale: de })}
                        </div>
                        <div className="text-xs">
                          {format(instance.date, 'EEEE', { locale: de })}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Clock className="h-4 w-4 inline-block mr-1" />
                            <span className="text-sm">
                              {format(instance.date, 'HH:mm', { locale: de })} Uhr
                            </span>
                          </div>
                          
                          {instance.attendeeCount !== undefined && (
                            <Badge variant="outline">
                              {instance.attendeeCount} {instance.attendeeCount === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          {instance.response === 'yes' && (
                            <Badge className="bg-green-500">Teilgenommen</Badge>
                          )}
                          {instance.response === 'no' && (
                            <Badge variant="destructive">Nicht teilgenommen</Badge>
                          )}
                          {instance.response === 'maybe' && (
                            <Badge variant="outline">Vielleicht</Badge>
                          )}
                          {!instance.response && (
                            <Badge variant="outline">Keine Antwort</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 