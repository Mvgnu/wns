'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupProps {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  location: string | null;
  memberCount?: number;
  createdAt: Date;
}

interface UserProfileGroupsProps {
  userId: string;
}

export default function UserProfileGroups({ userId }: UserProfileGroupsProps) {
  const [groups, setGroups] = useState<GroupProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/groups`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        
        const data = await response.json();
        setGroups(data.groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('Failed to load groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
              </div>
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

  if (groups.length === 0) {
    return (
      <div className="p-6 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Groups Yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          This user hasn't joined any groups yet.
        </p>
        <Button asChild>
          <Link href="/groups">Explore Groups</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`} className="block">
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex gap-4">
              <div className="h-16 w-16 relative rounded-md overflow-hidden flex-shrink-0">
                {group.image ? (
                  <Image
                    src={group.image}
                    alt={group.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted h-full w-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg truncate">{group.name}</h3>
                  <Badge variant="outline">{group.sport}</Badge>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  <span>Joined {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
                
                {group.location && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{group.location}</span>
                  </div>
                )}
                
                {group.memberCount !== undefined && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                  </div>
                )}
                
                {group.description && (
                  <p className="text-sm mt-2 line-clamp-2">{group.description}</p>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 