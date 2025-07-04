'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import FeedPostCard from './FeedPostCard';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FeedPost, 
  FeedPostAuthor, 
  FeedPostLike, 
  FeedPostReply, 
  FeedPostTargetWithEntity,
  FeedPostWithRelations
} from '@/types/feed';

interface FeedPostListProps {
  initialPosts?: FeedPostWithRelations[];
  fetchUrl: string;
  emptyMessage?: string;
  onPostsLoaded?: (posts: FeedPostWithRelations[]) => void;
  showCreatePostForm?: boolean;
}

export default function FeedPostList({
  initialPosts = [],
  fetchUrl,
  emptyMessage = "No posts to show",
  onPostsLoaded,
  showCreatePostForm = false
}: FeedPostListProps) {
  const [posts, setPosts] = useState<FeedPostWithRelations[]>(initialPosts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(initialPosts.length > 0);
  const { ref, inView } = useInView();

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${fetchUrl}?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (data.posts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prevPosts => {
          // Filter out duplicates (in case of concurrent requests)
          const newPosts = [...prevPosts];
          const existingIds = new Set(prevPosts.map(post => post.id));
          
          data.posts.forEach((post: FeedPostWithRelations) => {
            if (!existingIds.has(post.id)) {
              newPosts.push(post);
              existingIds.add(post.id);
            }
          });
          
          return newPosts;
        });
        
        setPage(prevPage => prevPage + 1);
        
        if (onPostsLoaded) {
          onPostsLoaded(data.posts);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching posts');
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl, page, isLoading, hasMore, onPostsLoaded]);
  
  // Load initial posts if none provided
  useEffect(() => {
    if (initialPosts.length === 0 && !isLoading) {
      loadMorePosts();
    }
  }, [initialPosts.length, loadMorePosts, isLoading]);
  
  // Load more posts when scrolled to the bottom
  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      loadMorePosts();
    }
  }, [inView, loadMorePosts, isLoading, hasMore]);
  
  // Update post when liked/unliked
  const handlePostLiked = (postId: string, liked: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            userHasLiked: liked,
            likeCount: liked ? post.likeCount + 1 : post.likeCount - 1
          };
        }
        return post;
      })
    );
  };
  
  // Add new reply to post
  const handleReplyAdded = (postId: string, reply: FeedPostReply & { author: FeedPostAuthor }) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            replies: [reply, ...post.replies],
            replyCount: post.replyCount + 1
          };
        }
        return post;
      })
    );
  };
  
  // Remove a reply from post
  const handleReplyRemoved = (postId: string, replyId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            replies: post.replies.filter(reply => reply.id !== replyId),
            replyCount: post.replyCount - 1
          };
        }
        return post;
      })
    );
  };
  
  // If there are no posts and we're not loading more
  if (posts.length === 0 && !isLoading && !hasMore) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map(post => (
        <FeedPostCard
          key={post.id}
          post={post}
          onLike={handlePostLiked}
          onReplyAdded={handleReplyAdded}
          onReplyRemoved={handleReplyRemoved}
        />
      ))}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Intersection observer target */}
      {hasMore && !isLoading && <div ref={ref} className="h-10" />}
    </div>
  );
} 