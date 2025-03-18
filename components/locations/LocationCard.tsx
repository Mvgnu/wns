"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSportByValue } from "@/lib/sportsData";

interface LocationCardProps {
  id: string;
  name: string;
  description?: string;
  type: string;
  sport: string;
  address?: string;
  rating?: number;
  image?: string;
  createdAt?: Date;
  _count?: {
    reviews: number;
  };
}

export default function LocationCard({
  id,
  name,
  description,
  type,
  sport,
  address,
  rating,
  image,
  createdAt,
  _count,
}: LocationCardProps) {
  // Get the display name for the sport
  const sportInfo = getSportByValue(sport);
  const sportName = sportInfo?.label || sport;
  const reviewCount = _count?.reviews || 0;

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${
              i < Math.round(rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-gray-200">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
            <MapPin size={40} />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
              {type}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
              {sportName}
            </span>
          </div>
        </div>
        {rating !== undefined && rating > 0 && (
          <CardDescription className="mt-1">
            {renderStars(rating)}
            <span className="text-xs text-gray-500 ml-1">
              {reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'}
            </span>
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pb-4">
        {address && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </div>
        )}
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {description || `Ein ${type} für ${sportName}-Enthusiasten.`}
        </p>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/locations/${id}`}>Details ansehen</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 