"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface GroupRecommendation {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    members: number;
    events: number;
  };
  score: number;
  reasons: string[];
}

// Define the recommendation response type from the API
interface RecommendationResponse {
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    sport: string;
    owner?: {
      id: string;
      name: string | null;
      image: string | null;
    };
    _count?: {
      members: number;
      events: number;
    };
  };
  score: number;
  reasons: string[];
}

export default function GroupRecommendations() {
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups/recommendations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      
      // Make sure we normalize the data structure
      const processedRecommendations = data.recommendations.map((recommendation: RecommendationResponse) => {
        // Ensure each group has the expected structure
        const group = recommendation.group || {};
        return {
          ...group,
          score: recommendation.score,
          reasons: recommendation.reasons || [],
          _count: group._count || { members: 0, events: 0 }
        };
      });
      
      setRecommendations(processedRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Empfehlungen verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Empfohlene Gruppen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative">
              {group.image && (
                <img 
                  src={group.image} 
                  alt={group.name} 
                  className="w-full h-full object-cover"
                />
              )}
              <Badge className="absolute top-2 right-2">
                {group.sport}
              </Badge>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{group.name}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={group.owner?.image || undefined} />
                  <AvatarFallback>{group.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {group.owner?.name || 'Unknown'}
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              <CardDescription className="line-clamp-2">
                {group.description || 'Keine Beschreibung verfügbar'}
              </CardDescription>
              
              <div className="flex items-center mt-4 space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {group._count?.members ?? 0} {(group._count?.members ?? 0) === 1 ? 'Mitglied' : 'Mitglieder'}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {group._count?.events ?? 0} {(group._count?.events ?? 0) === 1 ? 'Event' : 'Events'}
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/groups/${group.id}`}>
                  Gruppe ansehen
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 