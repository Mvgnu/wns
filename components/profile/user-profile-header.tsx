'use client';

import { User } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Edit, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export default function UserProfileHeader({ user, isOwnProfile }: UserProfileHeaderProps) {
  const router = useRouter();
  
  // Generate initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format date as "X time ago"
  const formatMemberSince = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <Card className="shadow-md overflow-hidden">
      {/* Cover photo - could be customized in the future */}
      <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500" />
      
      <CardContent className="pt-0">
        <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-4">
          {/* Avatar */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
            <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end flex-grow mt-4 md:mt-0 md:ml-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Member {formatMemberSince(user.createdAt)}
              </p>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              {isOwnProfile ? (
                <Button onClick={() => router.push('/profile/edit')} className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href={`/messages/new?recipient=${user.id}`} className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Bio */}
          <div className="col-span-2">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-muted-foreground">
              {user.bio || 'No bio provided yet.'}
            </p>
          </div>
          
          {/* Location and Sports */}
          <div className="space-y-4">
            {user.location && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Location
                </h3>
                <p>{user.location}</p>
              </div>
            )}
            
            {user.sports && user.sports.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sports</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sports.map((sport) => (
                    <Badge key={sport} variant="secondary">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 