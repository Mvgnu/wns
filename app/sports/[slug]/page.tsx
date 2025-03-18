'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const sportTypes = {
  'skating': {
    name: 'Skating',
    description: 'Connect with skaters, find skate parks, and share your tricks.',
    image: '/images/skating.jpg',
    locationTypes: ['skatepark', 'street_spot', 'bowl', 'vert_ramp']
  },
  'mountain-biking': {
    name: 'Mountain Biking',
    description: 'Discover trails, join group rides, and share your biking adventures.',
    image: '/images/mountain-biking.jpg',
    locationTypes: ['trail', 'route', 'park']
  },
  'hiking': {
    name: 'Hiking',
    description: 'Find hiking trails, camping spots, and connect with fellow hikers.',
    image: '/images/hiking.jpg',
    locationTypes: ['trail', 'route', 'park']
  },
  'fishing': {
    name: 'Fishing',
    description: 'Discover fishing spots, share tips, and connect with anglers.',
    image: '/images/fishing.jpg',
    locationTypes: ['lake', 'river', 'coast', 'pier']
  },
  'running': {
    name: 'Running',
    description: 'Find running routes, join races, and connect with runners.',
    image: '/images/running.jpg',
    locationTypes: ['trail', 'route', 'park']
  },
  'photography': {
    name: 'Photography',
    description: 'Discover photography spots, share tips, and showcase your work.',
    image: '/images/photography.jpg',
    locationTypes: ['landscape', 'urban', 'wildlife']
  }
};

interface SportPageProps {
  params: {
    slug: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  image?: string;
  sport: string;
  _count?: {
    members: number;
  };
}

interface Location {
  id: string;
  name: string;
  description: string;
  type: string;
  sport: string;
  image?: string;
  rating?: number;
  _count?: {
    reviews: number;
  };
}

export default function SportPage({ params }: SportPageProps) {
  const { slug } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Validate sport slug
  const sportInfo = sportTypes[slug as keyof typeof sportTypes];
  
  useEffect(() => {
    if (!sportInfo) {
      router.push('/404');
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch groups for this sport
        const groupsResponse = await fetch(`/api/groups?sport=${slug}`);
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups(groupsData);
        }

        // Fetch locations for this sport
        const locationsResponse = await fetch(`/api/locations?sport=${slug}`);
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setLocations(locationsData.locations || []);
        }
      } catch (error) {
        console.error(`Error fetching data for ${slug}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug, router, toast]);

  if (!sportInfo) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{sportInfo.name}</h1>
        <p className="text-lg mb-4">{sportInfo.description}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/groups/create">Create Group</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/locations/create">Add Location</Link>
          </Button>
        </div>
      </div>

      {/* Groups Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{sportInfo.name} Groups</h2>
          <Button asChild variant="outline">
            <Link href={`/groups?sport=${slug}`}>View all</Link>
          </Button>
        </div>
        
        {groups.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">No groups found</h3>
            <p className="text-gray-500 mb-4">Be the first to create a group for {sportInfo.name}</p>
            <Button asChild>
              <Link href="/groups/create">Create Group</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(groups) && groups.slice(0, 3).map(group => (
              <Card key={group.id} className="h-full">
                <CardHeader>
                  <CardTitle className="truncate">{group.name}</CardTitle>
                  <CardDescription>
                    {group._count?.members || 0} members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3">{group.description}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/groups/${group.id}`}>View Group</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Locations Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{sportInfo.name} Locations</h2>
          <Button asChild variant="outline">
            <Link href={`/locations?sport=${slug}`}>View all</Link>
          </Button>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">No locations found</h3>
            <p className="text-gray-500 mb-4">Be the first to add a location for {sportInfo.name}</p>
            <Button asChild>
              <Link href="/locations/create">Add Location</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(locations) && locations.slice(0, 3).map(location => (
              <Card key={location.id} className="h-full">
                <CardHeader>
                  <CardTitle className="truncate">{location.name}</CardTitle>
                  <CardDescription>
                    {location.type} • {location._count?.reviews || 0} reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3">{location.description}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/locations/${location.id}`}>View Location</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
} 