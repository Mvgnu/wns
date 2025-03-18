'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ThumbsUp, ThumbsDown, Map, Users, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  location: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  isPrivate: boolean;
};

type GroupRecommendation = {
  group: Group;
  score: number;
  reasons: string[];
};

export function GroupRecommendations() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch group recommendations when component mounts
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/groups/recommendations?limit=4');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching group recommendations:', error);
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (groupId: string, interaction: 'clicked' | 'joined' | 'dismissed') => {
    try {
      await fetch('/api/groups/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          interaction,
        }),
      });
      
      // If dismissed, remove from list
      if (interaction === 'dismissed') {
        setRecommendations(prev => prev.filter(r => r.group.id !== groupId));
      }
      
      // If clicked, navigate to group page
      if (interaction === 'clicked') {
        router.push(`/groups/${groupId}`);
      }
      
      // If joined, refresh recommendations after navigating
      if (interaction === 'joined') {
        router.push(`/groups/${groupId}?action=join`);
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recommended Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecommendations}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="py-8 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Recommendations Yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Update your profile with your interests to get personalized group recommendations.
        </p>
        <Button onClick={() => router.push('/profile/edit')}>
          Update Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommended Groups</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecommendations}
        >
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.group.id} className="overflow-hidden h-full flex flex-col">
            <div className="relative h-32 bg-muted">
              {recommendation.group.image ? (
                <Image
                  src={recommendation.group.image}
                  alt={recommendation.group.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-100 to-indigo-100">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-lg truncate">{recommendation.group.name}</CardTitle>
                <Badge variant="outline">{recommendation.group.sport}</Badge>
              </div>
              {recommendation.group.location && (
                <CardDescription className="flex items-center mt-1">
                  <Map className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    {recommendation.group.locationName || recommendation.group.location}
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pb-2 flex-grow">
              <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {recommendation.group.description || 'No description available.'}
              </div>
              
              <div className="space-y-1">
                {recommendation.reasons.slice(0, 2).map((reason, index) => (
                  <div key={index} className="flex items-start text-xs">
                    <Check className="h-3 w-3 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="pt-2 flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => handleInteraction(recommendation.group.id, 'joined')}
              >
                Join Group
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleInteraction(recommendation.group.id, 'clicked')}
                className="flex-1"
              >
                View Details
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleInteraction(recommendation.group.id, 'dismissed')}
                className="h-8 w-8"
                aria-label="Dismiss recommendation"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 