'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Users, Clock, Calendar, Route, Mountain, ArrowRight, Pin, Award, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Type definitions
export interface PlaceProps {
  id: string;
  name: string;
  description?: string | null;
  placeType: 'facility' | 'trail' | 'spot';
  detailType: string;
  sport: string;
  sports: string[];
  latitude: number;
  longitude: number;
  address?: string | null;
  images: string[];
  rating?: number | null;
  isLineBased: boolean;
  distance?: number | null;
  difficulty?: string | null;
  priceRange?: string | null;
  verified: boolean;
  featured: boolean;
  reviewCount: number;
  addedBy?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

export default function PlaceCard({ 
  id, 
  name, 
  description, 
  placeType,
  detailType,
  sport, 
  sports,
  images, 
  rating, 
  isLineBased,
  distance,
  difficulty,
  priceRange,
  verified,
  featured,
  reviewCount,
  addedBy
}: PlaceProps) {

  // Helper to get place type icon
  const getPlaceIcon = () => {
    switch (placeType) {
      case 'facility':
        return detailType === 'studio' ? 
          <Users className="h-4 w-4 mr-1" /> : 
          <MapPin className="h-4 w-4 mr-1" />;
      case 'trail':
        return <Route className="h-4 w-4 mr-1" />;
      case 'spot':
        return <Pin className="h-4 w-4 mr-1" />;
      default:
        return <MapPin className="h-4 w-4 mr-1" />;
    }
  };
  
  // Helper to get place type display name
  const getPlaceTypeDisplay = () => {
    switch (placeType) {
      case 'facility':
        return detailType.charAt(0).toUpperCase() + detailType.slice(1);
      case 'trail':
        return 'Trail';
      case 'spot':
        return detailType.charAt(0).toUpperCase() + detailType.slice(1) + ' Spot';
      default:
        return 'Location';
    }
  };
  
  // Helper to get difficulty badge color
  const getDifficultyColor = (diff?: string | null) => {
    if (!diff) return 'bg-gray-200 text-gray-800';
    
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  // Format price range for display
  const getPriceDisplay = (price?: string | null) => {
    if (!price) return null;
    
    switch (price.toLowerCase()) {
      case 'free':
        return 'Free';
      case 'low':
        return '€';
      case 'medium':
        return '€€';
      case 'high':
        return '€€€';
      default:
        return null;
    }
  };

  // Determine if we have a featured image
  const mainImage = images && images.length > 0 
    ? images[0] 
    : `/images/placeholders/${placeType}-placeholder.jpg`;

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={mainImage}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Badges for special status */}
        <div className="absolute top-2 right-2 flex gap-1 flex-wrap">
          {featured && (
            <Badge variant="default" className="bg-amber-500 text-white">
              <Award className="h-3 w-3 mr-1" /> Featured
            </Badge>
          )}
          {verified && (
            <Badge variant="default" className="bg-blue-500 text-white">
              <Check className="h-3 w-3 mr-1" /> Verified
            </Badge>
          )}
        </div>
        
        {/* Type indicator */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/80 text-gray-800 font-medium">
            {getPlaceIcon()} {getPlaceTypeDisplay()}
          </Badge>
        </div>
        
        {/* Sport badges */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {sports.slice(0, 2).map(sportItem => (
            <Badge key={sportItem} variant="outline" className="bg-white/80 text-gray-800">
              {sportItem}
            </Badge>
          ))}
          {sports.length > 2 && (
            <Badge variant="outline" className="bg-white/80 text-gray-800">
              +{sports.length - 2}
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{name}</h3>
          {rating !== null && rating !== undefined && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
              {rating.toFixed(1)}
              <span className="text-gray-500 ml-1">({reviewCount})</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-grow">
        {description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        )}
        
        <div className="grid grid-cols-1 gap-2 mt-auto">
          {/* Show different details based on place type */}
          {placeType === 'facility' && priceRange && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              <span>Price: {getPriceDisplay(priceRange)}</span>
            </div>
          )}
          
          {placeType === 'trail' && (
            <>
              {distance && (
                <div className="flex items-center text-sm text-gray-600">
                  <Route className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{distance.toFixed(1)} km</span>
                </div>
              )}
              {difficulty && (
                <div className="flex items-center text-sm">
                  <Mountain className="h-4 w-4 mr-1 text-gray-400" />
                  <Badge className={cn("text-xs", getDifficultyColor(difficulty))}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Badge>
                </div>
              )}
            </>
          )}
          
          {/* Show added by for all types */}
          {addedBy && addedBy.name && (
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span>Added by:</span>
              <Avatar className="h-4 w-4 ml-2 mr-1">
                {addedBy.image ? (
                  <AvatarImage src={addedBy.image} alt={addedBy.name} />
                ) : (
                  <AvatarFallback className="text-[8px]">
                    {addedBy.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span>{addedBy.name}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <Link 
          href={`/locations/${id}`}
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center w-full justify-center"
        >
          View Details <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
} 