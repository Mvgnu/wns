"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Users, MapPin, Calendar } from "lucide-react";
import { getSportByValue } from "@/lib/sportsData";

interface GroupCardProps {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sport: string;
  sports?: string[];
  location?: string;
  createdAt: Date;
  _count?: {
    members: number;
    posts?: number;
    events?: number;
  };
}

export default function GroupCard({
  id,
  name,
  description,
  image,
  sport,
  sports,
  location,
  createdAt,
  _count,
}: GroupCardProps) {
  // Get the display name for the primary sport
  const sportInfo = getSportByValue(sport);
  const sportName = sportInfo?.label || sport;
  const memberCount = _count?.members || 0;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-32 bg-gray-200">
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
            <Users size={40} />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
          <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            <Users size={14} className="mr-1" />
            {memberCount} {memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
          </div>
        </div>
        <CardDescription className="flex flex-wrap gap-1 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
            {sportName}
          </span>
          {location && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
              <MapPin size={12} className="mr-1" />
              {location}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-gray-600 line-clamp-3">
          {description || `Eine Gruppe für ${sportName}-Enthusiasten.`}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/groups/${id}`}>Gruppe ansehen</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 