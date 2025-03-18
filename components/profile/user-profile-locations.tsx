'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Map, Calendar, Route, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface LocationProps {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  type: string;
  sport: string;
  sports: string[];
  rating: number | null;
  address: string | null;
  createdAt: Date;
  isLineBased: boolean;
}

interface UserProfileLocationsProps {
  userId: string;
}

export default function UserProfileLocations({ userId }: UserProfileLocationsProps) {
  const [locations, setLocations] = useState<LocationProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/locations`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        
        const data = await response.json();
        setLocations(data.locations);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError('Failed to load locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [userId]);

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const renderRating = (rating: number | null) => {
    if (rating === null) return null;
    
    return (
      <div className="flex items-center">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="p-6 text-center">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Locations Yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          This user hasn't added any locations yet.
        </p>
        <Button asChild>
          <Link href="/locations/new">Add a Location</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {locations.map((location) => (
        <Link key={location.id} href={`/locations/${location.id}`}>
          <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
            <div className="relative h-40 bg-muted">
              {location.images && location.images.length > 0 ? (
                <Image
                  src={location.images[0]}
                  alt={location.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {location.isLineBased ? (
                    <Route className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Map className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {/* Location type indicator */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="capitalize">
                  {location.isLineBased ? 'Route' : location.type}
                </Badge>
              </div>
              
              {/* Rating indicator */}
              {location.rating !== null && (
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-sm flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                  {location.rating.toFixed(1)}
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-lg mb-1 line-clamp-1">{location.name}</h3>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {location.sports.map((sport) => (
                  <Badge key={sport} variant="outline" className="text-xs">
                    {sport}
                  </Badge>
                ))}
              </div>
              
              {location.address && (
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{location.address}</span>
                </div>
              )}
              
              {location.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {location.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Added {formatDate(location.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 