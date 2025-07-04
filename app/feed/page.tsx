import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import CreateFeedPostForm from '@/components/feed/CreateFeedPostForm';
import FeedPostList from '@/components/feed/FeedPostList';
import { Newspaper, Users, MapPin, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/feed');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Feed</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="md:col-span-2 space-y-6">
          {/* Create post form */}
          <CreateFeedPostForm />
          
          {/* Feed tabs */}
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <Suspense fallback={<FeedSkeleton />}>
                <FeedPostList
                  fetchUrl="/api/feed"
                  emptyMessage="No posts in your feed yet. Join groups, follow locations, or attend events to see content here!"
                />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="groups" className="mt-6">
              <Suspense fallback={<FeedSkeleton />}>
                <FeedPostList
                  fetchUrl="/api/feed?filter=groups"
                  emptyMessage="No group posts in your feed. Join some groups to see their content here!"
                />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="locations" className="mt-6">
              <Suspense fallback={<FeedSkeleton />}>
                <FeedPostList
                  fetchUrl="/api/feed?filter=locations"
                  emptyMessage="No location posts in your feed. Follow some locations to see their updates!"
                />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="events" className="mt-6">
              <Suspense fallback={<FeedSkeleton />}>
                <FeedPostList
                  fetchUrl="/api/feed?filter=events"
                  emptyMessage="No event posts in your feed. Join events to see related posts here!"
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="hidden md:block space-y-6">
          {/* User's groups */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Groups
              </h2>
              <Suspense fallback={<SidebarSkeleton />}>
                <UserGroupsList userId={session.user.id} />
              </Suspense>
            </CardContent>
          </Card>
          
          {/* Upcoming Events */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </h2>
              <Suspense fallback={<SidebarSkeleton />}>
                <UpcomingEventsList userId={session.user.id} />
              </Suspense>
            </CardContent>
          </Card>
          
          {/* Nearby Locations */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Nearby Locations
              </h2>
              <Suspense fallback={<SidebarSkeleton />}>
                <NearbyLocationsList />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Placeholder component for user's groups in sidebar
async function UserGroupsList({ userId }: { userId: string }) {
  // Here you would fetch the user's groups from the database
  // For now we'll return a placeholder message
  return (
    <p className="text-muted-foreground text-sm">
      You're not a member of any groups yet. Join groups to connect with others!
    </p>
  );
}

// Placeholder component for upcoming events in sidebar
async function UpcomingEventsList({ userId }: { userId: string }) {
  // Here you would fetch upcoming events the user is attending
  // For now we'll return a placeholder message
  return (
    <p className="text-muted-foreground text-sm">
      You don't have any upcoming events. Find events to attend!
    </p>
  );
}

// Placeholder component for nearby locations in sidebar
async function NearbyLocationsList() {
  // Here you would fetch nearby locations
  // For now we'll return a placeholder message
  return (
    <p className="text-muted-foreground text-sm">
      We couldn't determine your location. Allow location access to see nearby spots and trails.
    </p>
  );
}

// Loading skeletons
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-[90%] mb-2" />
            <Skeleton className="h-4 w-[95%] mb-2" />
            <Skeleton className="h-4 w-[60%] mb-4" />
            <Skeleton className="h-32 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-4/6" />
    </div>
  );
} 