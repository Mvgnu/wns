'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LocationMap from '@/components/locations/LocationMap';
import { 
  Star, 
  MapPin, 
  Share2, 
  Calendar, 
  ChevronRight, 
  MessageSquare, 
  Camera, 
  Users, 
  Info, 
  ArrowRight,
  ArrowUpRight,
  ThumbsUp,
  CalendarDays,
  PlusCircle
} from 'lucide-react';

// Define types
interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: User;
}

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  image: string | null;
  organizer: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  type: string;
  sport: string;
  latitude: number;
  longitude: number;
  address: string | null;
  images: string[];
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
  addedBy: User;
  reviews: Review[];
  events: Event[];
  isLineBased?: boolean;
  coordinates?: any[];
}

interface LocationDetailClientProps {
  location: Location;
  averageRating: number;
  sportLabel: string;
}

// Helper function to format date and time
const formatTime = (date: Date): string => {
  return format(new Date(date), 'HH:mm');
};

export default function LocationDetailClient({
  location,
  averageRating,
  sportLabel
}: LocationDetailClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('info');

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: location.name,
          text: `Schau dir diese Location an: ${location.name} für ${sportLabel}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Fehler beim Teilen:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link kopiert!',
          description: 'Location-Link in die Zwischenablage kopiert',
          variant: 'default',
        });
      } catch (error) {
        console.error('Fehler beim Kopieren in die Zwischenablage:', error);
        toast({
          title: 'Fehler',
          description: 'Link konnte nicht in die Zwischenablage kopiert werden',
          variant: 'destructive',
        });
      }
    }
  };

  const handleReviewSubmit = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/locations/${location.id}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/locations/${location.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bewertung konnte nicht übermittelt werden');
      }

      toast({
        title: 'Bewertung übermittelt!',
        description: 'Vielen Dank für dein Feedback',
        variant: 'default',
      });
      setIsReviewDialogOpen(false);
      setReviewRating(5);
      setReviewComment('');
      router.refresh();
    } catch (error) {
      console.error('Fehler beim Übermitteln der Bewertung:', error);
      toast({
        title: 'Fehler',
        description:
          error instanceof Error ? error.message : 'Bewertung konnte nicht übermittelt werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render star rating
  const renderRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizesMap = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className={`${sizesMap[size]} text-yellow-400 fill-yellow-400`} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className={`${sizesMap[size]} text-gray-300`} />
            <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
              <Star className={`${sizesMap[size]} text-yellow-400 fill-yellow-400`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className={`${sizesMap[size]} text-gray-300`} />
        );
      }
    }
    
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      {/* Hero section with main image */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-gray-900">
        {location.images.length > 0 ? (
          <div className="absolute inset-0">
            <img
              src={location.images[activeImageIndex]}
              alt={location.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-blue-900 flex items-center justify-center">
            <MapPin className="text-white/20 h-24 w-24" />
          </div>
        )}
        
        {/* Image thumbnails */}
        {location.images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {location.images.slice(0, 5).map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  index === activeImageIndex ? 'border-white scale-110' : 'border-white/50 hover:border-white/80'
                }`}
              >
                <img src={image} alt={`${location.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {location.images.length > 5 && (
              <button
                className="w-12 h-12 rounded-md bg-black/50 text-white flex items-center justify-center border-2 border-white/50 hover:border-white/80"
                onClick={() => setIsReviewDialogOpen(true)} // We'll replace this with a gallery view in the future
              >
                +{location.images.length - 5}
              </button>
            )}
          </div>
        )}
        
        {/* Location info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 bg-gradient-to-t from-black/90 to-transparent pt-20">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-green-600 hover:bg-green-700 border-none">
                {location.type}
              </Badge>
              <Badge className="bg-blue-600 hover:bg-blue-700 border-none">
                {sportLabel}
              </Badge>
              {averageRating > 0 && (
                <Badge variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{averageRating.toFixed(1)}</span>
                  </div>
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{location.name}</h1>
            {location.address && (
              <div className="flex items-center text-white/80 mb-3">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{location.address}</span>
              </div>
            )}
            <div className="flex items-center text-white/70 text-sm">
              <span>Hinzugefügt von {location.addedBy.name || 'Anonym'}</span>
              <span className="mx-2">•</span>
              <span>{formatDistanceToNow(new Date(location.createdAt), { addSuffix: true, locale: de })}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button onClick={handleShareClick} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Teilen
              </Button>
              <Button onClick={() => setIsReviewDialogOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                <Star className="h-4 w-4" />
                Bewertung
              </Button>
              {session?.user?.id === location.addedBy.id && (
                <Button variant="outline" className="gap-2" asChild>
                  <Link href={`/locations/${location.id}/edit`}>
                    <MessageSquare className="h-4 w-4" />
                    Bearbeiten
                  </Link>
                </Button>
              )}
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-100 p-1 mb-6">
                <TabsTrigger 
                  value="info" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Karte
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Bewertungen
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </TabsTrigger>
              </TabsList>
              
              {/* Info Tab */}
              <TabsContent value="info" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>Über diese Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {location.description ? (
                      <p className="text-gray-700 whitespace-pre-line">{location.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">Keine Beschreibung vorhanden</p>
                    )}
                    
                    {location.images.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Bilder</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {location.images.map((image, index) => (
                            <div 
                              key={index} 
                              className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setActiveImageIndex(index)}
                            >
                              <img 
                                src={image} 
                                alt={`${location.name} ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Info Card */}
                <Card className="border-gray-100 shadow-sm bg-white mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle>Informationen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-full">
                          <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Adresse</p>
                          <p className="font-medium">{location.address || 'Keine Adresse angegeben'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-full">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sportart</p>
                          <p className="font-medium">{sportLabel}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-full">
                          <Star className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Bewertung</p>
                          <div className="flex items-center gap-2">
                            {averageRating > 0 ? (
                              <>
                                <span className="font-medium">{averageRating.toFixed(1)}</span>
                                {renderRating(averageRating)}
                                <span className="text-sm text-gray-500">({location.reviews.length} {location.reviews.length === 1 ? 'Bewertung' : 'Bewertungen'})</span>
                              </>
                            ) : (
                              <span className="text-gray-500">Noch keine Bewertungen</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-full">
                          <CalendarDays className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hinzugefügt</p>
                          <p className="font-medium">{formatDate(location.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Map Tab */}
              <TabsContent value="map" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle>Standort</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[400px] w-full relative">
                      <LocationMap
                        latitude={location.latitude}
                        longitude={location.longitude}
                        name={location.name}
                        isLineBased={location.isLineBased}
                        coordinates={location.coordinates}
                        initialZoom={14}
                        className="h-full w-full"
                      />
                    </div>
                    {location.address && (
                      <div className="p-4 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium">{location.address}</p>
                            <Button variant="link" className="h-auto p-0" asChild>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center mt-1 text-green-600"
                              >
                                In Google Maps öffnen
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Bewertungen</CardTitle>
                    <Button onClick={() => setIsReviewDialogOpen(true)}>Bewertung abgeben</Button>
                  </CardHeader>
                  <CardContent>
                    {location.reviews.length > 0 ? (
                      <div className="space-y-6">
                        {location.reviews.map((review) => (
                          <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex items-center mb-2">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={review.user.image || ''} />
                                <AvatarFallback className="bg-green-100 text-green-700">
                                  {review.user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.user.name || 'Anonym'}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: de })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center mb-2">
                              {renderRating(review.rating)}
                              <span className="ml-2 font-medium">{review.rating.toFixed(1)}</span>
                            </div>
                            {review.comment && (
                              <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Noch keine Bewertungen</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Sei der Erste, der eine Bewertung für diese Location abgibt.
                        </p>
                        <Button onClick={() => setIsReviewDialogOpen(true)}>
                          Bewertung abgeben
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Events Tab */}
              <TabsContent value="events" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Kommende Events</CardTitle>
                    <Button asChild>
                      <Link href={`/events/create?locationId=${location.id}`}>Event erstellen</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {location.events && location.events.length > 0 ? (
                      <div className="space-y-4">
                        {location.events.map((event) => (
                          <Card key={event.id} className="border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
                            <div className="flex flex-col sm:flex-row">
                              <div className="sm:w-1/4 bg-gray-100 relative">
                                {event.image ? (
                                  <img 
                                    src={event.image} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover min-h-[120px]"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 text-green-500 min-h-[120px]">
                                    <Calendar className="h-8 w-8 opacity-50" />
                                  </div>
                                )}
                                {event.startTime && (
                                  <div className="absolute top-2 left-2 bg-white p-2 rounded-md shadow-sm text-center min-w-[60px]">
                                    <p className="text-xs text-gray-500 uppercase">
                                      {formatDate(event.startTime, { month: 'short' })}
                                    </p>
                                    <p className="text-xl font-bold text-gray-900">
                                      {formatDate(event.startTime, { day: 'numeric' })}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4 sm:w-3/4">
                                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                  <span>
                                    {formatDate(event.startTime)} um {formatTime(event.startTime)}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-4">
                                  <Users className="h-4 w-4 mr-2 text-green-600" />
                                  <span>Organisiert von {event.organizer.name || 'Anonym'}</span>
                                </div>
                                <Button variant="outline" size="sm" className="group-hover:bg-green-50 group-hover:text-green-600" asChild>
                                  <Link href={`/events/${event.id}`} className="flex items-center">
                                    Event ansehen
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Keine kommenden Events</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Für diese Location sind aktuell keine Events geplant.
                        </p>
                        <Button asChild>
                          <Link href={`/events/create?locationId=${location.id}`}>
                            Event erstellen
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-6">
            {/* Added by */}
            <Card className="border-gray-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hinzugefügt von</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={location.addedBy.image || ''} />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {location.addedBy.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{location.addedBy.name || 'Anonym'}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(location.createdAt), { addSuffix: true, locale: de })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Rating overview */}
            <Card className="border-gray-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bewertungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                    <div className="mt-1">{renderRating(averageRating)}</div>
                    <span className="text-sm text-gray-500 mt-1">
                      {location.reviews.length} {location.reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}
                    </span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setIsReviewDialogOpen(true)}>
                  Bewertung abgeben
                </Button>
              </CardContent>
            </Card>
            
            {/* Similar locations card */}
            <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mehr entdecken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Finde weitere Locations für {sportLabel} und entdecke neue Sportmöglichkeiten.
                </p>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/locations?sport=${location.sport}`}>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-green-600" />
                        <span>Weitere {sportLabel} Locations</span>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/locations?type=${location.type}`}>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Weitere {location.type} Locations</span>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/locations/create">
                      <div className="flex items-center">
                        <PlusCircle className="h-4 w-4 mr-2 text-green-600" />
                        <span>Neue Location hinzufügen</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Events promo */}
            <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-green-600 to-blue-600 text-white">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Event an dieser Location planen?</h3>
                <p className="text-white/90 text-sm mb-4">
                  Erstelle ein Event und lade andere Sportbegeisterte ein, mit dir gemeinsam aktiv zu werden.
                </p>
                <Button variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                  <Link href={`/events/create?locationId=${location.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Event erstellen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bewertung abgeben</DialogTitle>
            <DialogDescription>
              Teile deine Erfahrungen mit dieser Location und hilf anderen Sportlern
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-center mb-4">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        (hoverRating !== null ? star <= hoverRating : star <= reviewRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <Textarea
              placeholder="Deine Erfahrungen mit dieser Location (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Bewertung abgeben'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}