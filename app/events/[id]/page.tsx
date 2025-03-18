'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Share2, Edit, Trash2, Check, X, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventTimeline from '@/components/events/EventTimeline';

interface EventProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventPage({ params }: EventProps) {
  const { id: eventId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Event konnte nicht geladen werden');
        }
        
        const data = await response.json();
        setEvent(data);
        
        // Check if the current user is attending
        if (session?.user?.id) {
          const isUserAttending = data.attendees.some(
            (attendee: any) => attendee.id === session.user.id
          );
          setIsAttending(isUserAttending);
        }
        
        setAttendeeCount(data.attendees.length);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Event konnte nicht geladen werden');
        setLoading(false);
      }
    }
    
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, session]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Lade Veranstaltung...</p>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{error || 'Veranstaltung nicht gefunden'}</p>
        <Button className="mt-4" asChild>
          <Link href="/events">Zurück zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  // Handle attend button click
  const handleAttendClick = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/events/${eventId}`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/attend`, {
        method: isAttending ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Handle specific errors
        if (res.status === 403 && errorData.error?.includes('member of the group')) {
          throw new Error('Sie müssen Mitglied der Gruppe sein, um an dieser Veranstaltung teilzunehmen');
        }
        
        throw new Error('Teilnahmestatus konnte nicht aktualisiert werden');
      }

      // Update state
      setIsAttending(!isAttending);
      setAttendeeCount(prev => isAttending ? prev - 1 : prev + 1);
      
      toast({
        title: isAttending ? 'Sie nehmen nicht mehr teil' : 'Sie nehmen jetzt teil!',
        description: isAttending ? 'Sie wurden von der Teilnehmerliste entfernt' : 'Sie wurden zur Teilnehmerliste hinzugefügt',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Teilnahme:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Teilnahmestatus konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share button click
  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || `Veranstaltung: ${event.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link kopiert',
        description: 'Der Link wurde in die Zwischenablage kopiert',
        variant: 'default',
      });
    }
  };

  const isOrganizer = session?.user?.id === event.organizer.id;
  const eventDate = new Date(event.startTime);
  const eventEndDate = event.endTime ? new Date(event.endTime) : null;
  const isPast = eventDate < new Date();
  
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Header */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="relative h-64 w-full">
              {event.image ? (
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <Calendar className="h-24 w-24 text-white opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {format(eventDate, 'PPP', { locale: de })}
                    {eventEndDate && eventDate.toDateString() !== eventEndDate.toDateString() && 
                      ` - ${format(eventEndDate, 'PPP', { locale: de })}`}
                  </span>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {format(eventDate, 'p', { locale: de })}
                    {eventEndDate && ` - ${format(eventEndDate, 'p', { locale: de })}`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b dark:border-gray-700">
              <div className="flex flex-col">
                {event.locationName && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {event.locationId ? (
                        <Link href={`/locations/${event.locationId}`} className="hover:underline">
                          {event.locationName}
                        </Link>
                      ) : (
                        event.locationName
                      )}
                    </span>
                  </div>
                )}
                {event.group && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                    <Users className="h-4 w-4 mr-1" />
                    <Link href={`/groups/${event.group.id}`} className="hover:underline">
                      {event.group.name}
                    </Link>
                  </div>
                )}
                {(event as any).joinRestriction === "groupOnly" && event.group && (
                  <div className="flex items-center text-amber-600 dark:text-amber-400 mt-1">
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Nur für Gruppenmitglieder</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {!isPast && !isOrganizer && (
                  <Button 
                    variant={isAttending ? "outline" : "default"}
                    onClick={handleAttendClick}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                  >
                    {isAttending ? (
                      <>
                        <X className="h-4 w-4" />
                        Nicht teilnehmen
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Teilnehmen
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" size="icon" onClick={handleShareClick}>
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {isOrganizer && (
                  <>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <Tabs defaultValue="details">
              <div className="px-4 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="attendees" className="flex-1">
                    Teilnehmer ({attendeeCount})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="details" className="p-4">
                <div className="prose dark:prose-invert max-w-none">
                  {event.description ? (
                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Keine Beschreibung verfügbar.
                    </p>
                  )}
                </div>
                
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="attendees" className="p-4">
                {event.attendees.length > 0 ? (
                  <div className="space-y-4">
                    {event.attendees.map((attendee: any) => (
                      <div key={attendee.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={attendee.image || undefined} />
                          <AvatarFallback>{attendee.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/profile/${attendee.id}`} className="font-medium hover:underline">
                            {attendee.name || 'Anonymer Benutzer'}
                          </Link>
                          {attendee.id === event.organizer.id && (
                            <Badge className="ml-2" variant="outline">Organisator</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Noch keine Teilnehmer.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Recurring Event Timeline */}
          {event.isRecurring && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
              <EventTimeline 
                eventId={event.id}
                title={event.title}
                startTime={new Date(event.startTime)}
                isRecurring={event.isRecurring}
                recurringPattern={event.recurringPattern}
                recurringDays={event.recurringDays}
                recurringEndDate={event.recurringEndDate ? new Date(event.recurringEndDate) : undefined}
              />
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Organisator</h3>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={event.organizer.image || undefined} />
                  <AvatarFallback>{event.organizer.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/profile/${event.organizer.id}`} className="font-medium hover:underline">
                    {event.organizer.name || 'Anonymer Benutzer'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Attendance Status */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Teilnahmestatus</h3>
              <div className="flex items-center justify-between">
                <span>Sie sind:</span>
                <Badge variant={isAttending ? "default" : "outline"}>
                  {isAttending ? 'Teilnehmend' : 'Nicht teilnehmend'}
                </Badge>
              </div>
              {!isPast && !isOrganizer && (
                <Button 
                  className="w-full mt-4"
                  variant={isAttending ? "outline" : "default"}
                  onClick={handleAttendClick}
                  disabled={isLoading}
                >
                  {isAttending ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Nicht teilnehmen
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Teilnehmen
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Event Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Veranstaltungsinfo</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Datum & Uhrzeit</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(eventDate, 'PPP', { locale: de })}
                      {eventEndDate && eventDate.toDateString() !== eventEndDate.toDateString() && (
                        <><br />{format(eventEndDate, 'PPP', { locale: de })}</>
                      )}
                      <br />
                      {format(eventDate, 'p', { locale: de })}
                      {eventEndDate && ` - ${format(eventEndDate, 'p', { locale: de })}`}
                    </p>
                  </div>
                </div>
                
                {event.locationName && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Ort</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.locationId ? (
                          <Link href={`/locations/${event.locationId}`} className="hover:underline">
                            {event.locationName}
                          </Link>
                        ) : (
                          event.locationName
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Teilnehmer</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {attendeeCount} {attendeeCount === 1 ? 'Person' : 'Personen'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 