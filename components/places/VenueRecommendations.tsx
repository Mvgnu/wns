import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Users, Clock, DollarSign, Star } from 'lucide-react';
import { PlaceAmenityWithAmenity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

// Types
interface VenueRecommendationsProps {
  allAmenities: PlaceAmenityWithAmenity[];
  userEventHistory?: {
    id: string;
    title: string;
    locationId: string;
    eventType: string;
    eventDate: string;
  }[];
  initialCapacity?: number;
  initialEventType?: string;
  onSelectVenue?: (venueId: string) => void;
}

interface Recommendation {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  maxCapacity: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  rating: number;
  mainImage: string;
  amenities: {
    id: string;
    name: string;
    icon: string;
  }[];
  eventCount: number;
  recommendationScore: number;
  recommendationReasons: string[];
}

export function VenueRecommendations({
  allAmenities,
  userEventHistory,
  initialCapacity,
  initialEventType,
  onSelectVenue
}: VenueRecommendationsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Filter criteria states
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(initialCapacity || 20);
  const [eventType, setEventType] = useState(initialEventType || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300 });
  const [radius, setRadius] = useState(10); // km
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Group amenities by category for better display
  const amenityCategories = allAmenities.reduce((acc, amenity) => {
    const category = amenity.amenity.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(amenity.amenity);
    return acc;
  }, {} as Record<string, any[]>);

  // Get recommendations based on current filters
  const getRecommendations = async () => {
    setLoading(true);
    
    try {
      const requestBody: any = {
        amenities: selectedAmenities,
        capacity,
        eventType: eventType || undefined,
        priceRange: {
          min: priceRange.min,
          max: priceRange.max
        },
        limit: 10
      };
      
      // Add location if available and enabled
      if (useLocation && userLocation) {
        requestBody.location = {
          ...userLocation,
          radius
        };
      }
      
      // Add previous event IDs if available
      if (userEventHistory && userEventHistory.length > 0) {
        requestBody.previousEventIds = userEventHistory.map(e => e.id);
      }
      
      const response = await fetch('/api/places/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching venue recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setUseLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          setUseLocation(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setUseLocation(false);
    }
  };
  
  // Handle amenity selection
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };
  
  // Handle venue selection
  const handleSelectVenue = (venueId: string) => {
    if (onSelectVenue) {
      onSelectVenue(venueId);
    } else {
      router.push(`/places/${venueId}`);
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Load recommendations on initial render and when filters change
  useEffect(() => {
    getRecommendations();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Find the Perfect Venue</CardTitle>
              <CardDescription>
                Customize your search to find venues that match your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Capacity */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Capacity</h3>
                <Slider
                  defaultValue={[capacity]}
                  max={500}
                  step={10}
                  onValueChange={(vals) => setCapacity(vals[0])}
                />
                <p className="text-sm text-muted-foreground">{capacity} people</p>
              </div>
              
              {/* Event Type */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Event Type</h3>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price Range */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Price Range (per hour)</h3>
                <div className="flex items-center space-x-2">
                  <span>{formatPrice(priceRange.min)}</span>
                  <Slider
                    defaultValue={[priceRange.min, priceRange.max]}
                    min={0}
                    max={1000}
                    step={10}
                    onValueChange={(vals) => setPriceRange({ min: vals[0], max: vals[1] })}
                  />
                  <span>{formatPrice(priceRange.max)}</span>
                </div>
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Use my location</h3>
                  <Checkbox 
                    checked={useLocation} 
                    onCheckedChange={(checked) => {
                      if (checked && !userLocation) {
                        getUserLocation();
                      } else {
                        setUseLocation(!!checked);
                      }
                    }} 
                  />
                </div>
                
                {useLocation && userLocation && (
                  <div className="space-y-2">
                    <h4 className="text-xs text-muted-foreground">Search radius</h4>
                    <Slider
                      defaultValue={[radius]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(vals) => setRadius(vals[0])}
                    />
                    <p className="text-sm text-muted-foreground">{radius} km</p>
                  </div>
                )}
              </div>
              
              {/* Amenities */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Amenities</h3>
                {Object.entries(amenityCategories).map(([category, amenities]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`amenity-${amenity.id}`}
                            checked={selectedAmenities.includes(amenity.id)}
                            onCheckedChange={() => toggleAmenity(amenity.id)}
                          />
                          <label 
                            htmlFor={`amenity-${amenity.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {amenity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={getRecommendations} className="w-full">
                Find Venues
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Recommendations */}
        <div className="col-span-1 md:col-span-3 space-y-4">
          <h2 className="text-2xl font-bold">Recommended Venues</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <Skeleton className="h-48 w-full md:w-64 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <div className="flex gap-2 mt-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-6">
              {recommendations.map((venue) => (
                <Card key={venue.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative h-48 w-full md:w-64 rounded-md overflow-hidden">
                        {venue.mainImage ? (
                          <Image
                            src={venue.mainImage}
                            alt={venue.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="bg-muted h-full w-full flex items-center justify-center">
                            <p className="text-muted-foreground">No image</p>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                          {venue.recommendationScore}% match
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold">{venue.name}</h3>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin size={16} />
                            <span>
                              {venue.address}, {venue.city}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm line-clamp-2">{venue.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users size={14} />
                            Up to {venue.maxCapacity} people
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatPrice(venue.pricePerHour)}/hour
                          </Badge>
                          {venue.rating && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star size={14} />
                              {venue.rating.toFixed(1)}
                            </Badge>
                          )}
                          {venue.eventCount > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock size={14} />
                              {venue.eventCount} past events
                            </Badge>
                          )}
                        </div>
                        
                        {/* Reasons for recommendation */}
                        {venue.recommendationReasons.length > 0 && (
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">Why we recommend this venue:</h4>
                            <ul className="text-sm space-y-1">
                              {venue.recommendationReasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-1 text-muted-foreground">
                                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Amenities preview */}
                        {venue.amenities && venue.amenities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium">Top amenities:</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {venue.amenities.slice(0, 5).map((amenity) => (
                                <Badge 
                                  key={amenity.id} 
                                  variant="secondary"
                                  className={selectedAmenities.includes(amenity.id) ? 'bg-primary/10' : ''}
                                >
                                  {amenity.name}
                                </Badge>
                              ))}
                              {venue.amenities.length > 5 && (
                                <Badge variant="outline">+{venue.amenities.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-3 flex justify-end">
                          <Button 
                            onClick={() => handleSelectVenue(venue.id)}
                            variant="default"
                          >
                            Select Venue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold mb-2">No venues match your criteria</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters to find more venues
                </p>
                <Button onClick={() => {
                  setSelectedAmenities([]);
                  setCapacity(20);
                  setEventType('');
                  setPriceRange({ min: 0, max: 300 });
                  setRadius(10);
                  setTimeout(getRecommendations, 0);
                }}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 