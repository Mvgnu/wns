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
  PlusCircle,
  Droplet,
  Coffee,
  ShoppingBag,
  Sparkles,
  ShowerHead,
  Car,
  CreditCard,
  Wifi,
  Bath,
  Waves,
  Hammer,
  Bike,
  Dumbbell,
  Accessibility,
  Video,
  Euro,
  UserCircle2
} from 'lucide-react';
import ClaimPlaceButton from '@/components/locations/ClaimPlaceButton';

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
  slug: string | null;
  startTime: Date;
  endTime: Date | null;
  image: string | null;
  organizer: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Amenity {
  id: string;
  type: string;
  details: any;
  isAvailable: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  featured: boolean;
  uploadedBy: User;
  createdAt: Date;
}

interface Price {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  period: string | null;
  isRecurring: boolean;
}

interface Staff {
  id: string;
  role: string;
  title: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  yearsExperience: number | null;
  schedule: any;
  socialLinks: any;
  user: User;
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
  slug: string | null;
  createdAt: Date;
  updatedAt: Date;
  addedBy: User;
  reviews: Review[];
  events: Event[];
  isLineBased?: boolean;
  coordinates?: any[];
  placeType: string;
  amenities: Amenity[];
  videos: Video[];
  prices: Price[];
  staff: Staff[];
}

interface LocationDetailClientProps {
  location: Location;
  averageRating: number;
  sportLabel: string;
  userIsStaff?: boolean;
  existingClaim?: {
    id: string;
    status: string;
  } | null;
}

// Helper function to format date and time
const formatTime = (date: Date): string => {
  return format(new Date(date), 'HH:mm');
};

export default function LocationDetailClient({
  location,
  averageRating,
  sportLabel,
  userIsStaff = false,
  existingClaim = null
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

  // Helper function to get icon for amenity type
  const getAmenityIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      SHOWER: <ShowerHead className="h-5 w-5" />,
      FOOD: <Coffee className="h-5 w-5" />,
      SHOP: <ShoppingBag className="h-5 w-5" />,
      WELLNESS: <Sparkles className="h-5 w-5" />,
      LOCKER_ROOM: <Bath className="h-5 w-5" />,
      PARKING: <Car className="h-5 w-5" />,
      CARD_PAYMENT: <CreditCard className="h-5 w-5" />,
      WIFI: <Wifi className="h-5 w-5" />,
      RESTROOM: <Bath className="h-5 w-5" />,
      WATER_FOUNTAIN: <Waves className="h-5 w-5" />,
      EQUIPMENT_RENTAL: <Hammer className="h-5 w-5" />,
      FIRST_AID: <Droplet className="h-5 w-5" />,
      CHILDCARE: <Users className="h-5 w-5" />,
      DISABLED_ACCESS: <Accessibility className="h-5 w-5" />,
      BIKE_STORAGE: <Bike className="h-5 w-5" />,
      TRAINING_AREA: <Dumbbell className="h-5 w-5" />
    };
    
    return iconMap[type] || <Info className="h-5 w-5" />;
  };
  
  // Helper function to get human-readable name for amenity type
  const getAmenityName = (type: string) => {
    const nameMap: Record<string, string> = {
      SHOWER: 'Duschen',
      FOOD: 'Essen',
      SHOP: 'Shop',
      WELLNESS: 'Wellness',
      LOCKER_ROOM: 'Umkleiden',
      PARKING: 'Parkplatz',
      CARD_PAYMENT: 'Kartenzahlung',
      WIFI: 'WLAN',
      RESTROOM: 'Toiletten',
      WATER_FOUNTAIN: 'Trinkbrunnen',
      EQUIPMENT_RENTAL: 'Ausrüstungsverleih',
      FIRST_AID: 'Erste Hilfe',
      CHILDCARE: 'Kinderbetreuung',
      DISABLED_ACCESS: 'Barrierefreiheit',
      BIKE_STORAGE: 'Fahrradabstellplatz',
      TRAINING_AREA: 'Trainingsbereich'
    };
    
    return nameMap[type] || type;
  };
  
  // Helper function for formatting video duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Helper function to extract video ID from URL
  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : '';
    } else if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(?:.*\/)?(?:videos\/)?([0-9]+)/);
      return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : '';
    }
    return '';
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
              <span>{formatDistanceToNow(new Date(location.createdAt), { locale: de })}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleShareClick}>
                <Share2 className="h-4 w-4 mr-2" /> Teilen
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewDialogOpen(true)}
              >
                <Star className="h-4 w-4 mr-2" /> Bewerten
              </Button>
              
              {!userIsStaff && (
                <ClaimPlaceButton 
                  placeId={location.id}
                  placeName={location.name}
                  placeType={location.placeType}
                  userIsMember={userIsStaff}
                  hasExistingClaim={!!existingClaim && existingClaim.status === 'pending'}
                />
              )}
              
              {session?.user?.id === location.addedBy.id && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/locations/${location.id}/edit`}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Bearbeiten
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
                  value="amenities" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Droplet className="h-4 w-4 mr-2" />
                  Ausstattung
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Euro className="h-4 w-4 mr-2" />
                  Preise
                </TabsTrigger>
                <TabsTrigger 
                  value="staff" 
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <UserCircle2 className="h-4 w-4 mr-2" />
                  Team
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
              
              {/* Amenities Tab */}
              <TabsContent value="amenities" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>Ausstattung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {location.amenities && location.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {location.amenities.map((amenity) => (
                          <div 
                            key={amenity.id} 
                            className={`flex items-center p-4 rounded-lg border ${
                              amenity.isAvailable 
                                ? 'border-green-100 bg-green-50' 
                                : 'border-gray-100 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className={`p-3 rounded-full mr-3 ${
                              amenity.isAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {getAmenityIcon(amenity.type)}
                            </div>
                            <div>
                              <p className="font-medium">{getAmenityName(amenity.type)}</p>
                              {amenity.details && Object.keys(amenity.details).length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {Object.entries(amenity.details).map(([key, value]) => {
                                    if (typeof value === 'boolean') {
                                      return value ? key.replace(/([A-Z])/g, ' $1').toLowerCase() : '';
                                    } else if (typeof value === 'number' || typeof value === 'string') {
                                      return `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`;
                                    }
                                    return '';
                                  }).filter(Boolean).join(', ')}
                                </p>
                              )}
                              {!amenity.isAvailable && (
                                <Badge variant="outline" className="mt-2 text-xs bg-white">Derzeit nicht verfügbar</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <Droplet className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Keine Ausstattungsinformationen</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Für diese Location wurden noch keine Ausstattungsdetails hinterlegt.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Videos Tab */}
              <TabsContent value="videos" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {location.videos && location.videos.length > 0 ? (
                      <div className="space-y-8">
                        {location.videos.map((video) => (
                          <div key={video.id} className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="aspect-video w-full bg-gray-900">
                              <iframe 
                                src={getVideoEmbedUrl(video.url)} 
                                allowFullScreen 
                                className="w-full h-full"
                                title={video.title}
                              ></iframe>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-medium text-gray-900">{video.title}</h3>
                              {video.description && (
                                <p className="text-gray-600 mt-1">{video.description}</p>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={video.uploadedBy.image || ''} />
                                    <AvatarFallback className="bg-green-100 text-green-700">
                                      {video.uploadedBy.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-600">{video.uploadedBy.name || 'Anonym'}</span>
                                </div>
                                {video.duration && (
                                  <Badge variant="outline" className="ml-2">
                                    {formatDuration(video.duration)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <Video className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Keine Videos</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Für diese Location wurden noch keine Videos hochgeladen.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>Preise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {location.prices && location.prices.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {location.prices.map((price) => (
                          <div key={price.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{price.name}</h3>
                                {price.description && (
                                  <p className="text-gray-600 text-sm mt-1">{price.description}</p>
                                )}
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  {price.isRecurring && (
                                    <Badge className="mr-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent">
                                      {price.period === 'month' ? 'Monatlich' : 
                                       price.period === 'year' ? 'Jährlich' :
                                       price.period === 'week' ? 'Wöchentlich' :
                                       price.period === 'day' ? 'Täglich' : 'Wiederkehrend'}
                                    </Badge>
                                  )}
                                  {!price.isRecurring && price.period && (
                                    <Badge className="mr-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent">
                                      {price.period === 'month' ? 'Monatspass' : 
                                       price.period === 'year' ? 'Jahrespass' :
                                       price.period === 'week' ? 'Wochenpass' :
                                       price.period === 'day' ? 'Tagespass' : price.period}
                                    </Badge>
                                  )}
                                  {!price.isRecurring && !price.period && (
                                    <Badge className="mr-2 bg-green-100 text-green-700 hover:bg-green-200 border-transparent">
                                      Einmalig
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                  {price.amount.toFixed(2)} {price.currency}
                                </span>
                                {price.period && (
                                  <span className="text-gray-500 text-sm ml-1">
                                    {price.isRecurring ? '/' : ''}{price.period === 'month' ? 'Monat' : 
                                      price.period === 'year' ? 'Jahr' :
                                      price.period === 'week' ? 'Woche' :
                                      price.period === 'day' ? 'Tag' : price.period}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <Euro className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Keine Preisinformationen</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Für diese Location wurden noch keine Preise hinterlegt.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Staff Tab */}
              <TabsContent value="staff" className="mt-0">
                <Card className="border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle>Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {location.staff && location.staff.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {location.staff.map((member) => (
                          <div key={member.id} className="flex border border-gray-100 rounded-lg overflow-hidden">
                            <div className="w-1/3 bg-gray-100">
                              <div className="w-full h-full flex items-center justify-center">
                                <Avatar className="h-20 w-20">
                                  <AvatarImage src={member.user.image || ''} className="object-cover" />
                                  <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                                    {member.user.name?.charAt(0) || 'T'}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                            <div className="w-2/3 p-4">
                              <Badge className="mb-2 capitalize">
                                {member.role === 'owner' ? 'Besitzer' : 
                                 member.role === 'manager' ? 'Manager' :
                                 member.role === 'instructor' ? 'Trainer' : member.role}
                              </Badge>
                              <h3 className="text-lg font-medium text-gray-900">{member.user.name || 'Teammitglied'}</h3>
                              {member.title && (
                                <p className="text-gray-600 text-sm">{member.title}</p>
                              )}
                              {member.specialties && member.specialties.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">Spezialisierung:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {member.specialties.map((specialty, index) => (
                                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {member.yearsExperience && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {member.yearsExperience} Jahre Erfahrung
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                          <UserCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Keine Teammitglieder</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Für diese Location wurden noch keine Teammitglieder hinterlegt.
                        </p>
                      </div>
                    )}
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
                                  {formatDistanceToNow(new Date(review.createdAt), { locale: de })}
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
                                  <Link href={`/events/${event.slug || event.id}`} className="flex items-center">
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
                      {formatDistanceToNow(new Date(location.createdAt), { locale: de })}
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
            
            {/* Amenities summary in sidebar */}
            {location.amenities && location.amenities.length > 0 && (
              <Card className="border-gray-100 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ausstattung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {location.amenities
                      .filter(amenity => amenity.isAvailable)
                      .slice(0, 6)
                      .map((amenity) => (
                        <Badge key={amenity.id} className="bg-green-50 text-green-700 border-none flex items-center gap-1.5 py-1.5 px-2.5">
                          {getAmenityIcon(amenity.type)}
                          <span>{getAmenityName(amenity.type)}</span>
                        </Badge>
                      ))}
                    {location.amenities.filter(a => a.isAvailable).length > 6 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab('amenities')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        +{location.amenities.filter(a => a.isAvailable).length - 6} mehr
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('amenities')}
                    className="w-full mt-4"
                  >
                    Alle Details anzeigen
                  </Button>
                </CardContent>
              </Card>
            )}
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