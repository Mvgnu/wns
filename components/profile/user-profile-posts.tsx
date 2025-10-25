'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, Calendar, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface PostProps {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  images?: string[];
  group?: {
    id: string;
    name: string;
  };
  _count?: {
    comments: number;
    likes: number;
  };
}

interface UserProfilePostsProps {
  userId: string;
}

export default function UserProfilePosts({ userId }: UserProfilePostsProps) {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      }
      
      const response = await fetch(`/api/users/${userId}/posts?page=${pageNumber}&limit=5`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (pageNumber === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data.posts]);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1);
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
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
          onClick={() => fetchPosts()}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Posts Yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          This user hasn't created any posts yet.
        </p>
        <Button asChild>
          <Link href="/posts/new">Create a Post</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.slug || post.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2">{post.title}</h3>
              
              <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {/* Strip HTML if content has HTML tags */}
                {post.content.replace(/<[^>]*>/g, '')}
              </div>
              
              {post.images && post.images.length > 0 && (
                <div className="relative h-40 rounded-md overflow-hidden mb-3">
                  <Image 
                    src={post.images[0]} 
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  {post.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs">
                      +{post.images.length - 1} more
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(post.createdAt)}
                  
                  {post.group && (
                    <span className="ml-3">
                      in <Link href={`/groups/${post.group.id}`} className="hover:underline font-medium">{post.group.name}</Link>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {post._count && (
                    <>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {post._count.comments}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {hasMore && (
        <div className="text-center mt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center">
                Load more posts
                <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 