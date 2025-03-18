'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
  group?: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
};

export default function PostsPage() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');
  const groupId = searchParams?.get('groupId');
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch posts with filters
  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = `/api/posts?page=${page}&limit=10`;
        
        if (userId) {
          url += `&userId=${userId}`;
        }
        
        if (groupId) {
          url += `&groupId=${groupId}`;
        }
        
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Beiträge konnten nicht geladen werden');
        }
        
        const data = await response.json();
        
        if (page === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        
        setHasMore(data.posts.length === 10);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPosts();
  }, [userId, groupId, searchTerm, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [userId, groupId, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Determine the page title based on filters
  let pageTitle = 'Beiträge';
  if (userId) {
    pageTitle = 'Nutzerbeiträge';
  } else if (groupId) {
    pageTitle = 'Gruppenbeiträge';
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">{pageTitle}</h1>
        
        <div className="flex space-x-2">
          <form onSubmit={handleSearch} className="flex-1 md:flex-none md:w-64">
            <Input
              type="search"
              placeholder="Beiträge suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </form>
          
          <Link href="/posts/create">
            <Button>
              Beitrag erstellen
            </Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              id={post.id}
              title={post.title}
              content={post.content}
              images={post.images}
              videos={post.videos}
              createdAt={post.createdAt}
              author={post.author}
              groupId={post.group?.id}
              groupName={post.group?.name}
              commentCount={post._count.comments}
              likeCount={post._count.likes}
              isLiked={post.isLiked}
            />
          ))
        ) : !isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Keine Beiträge gefunden.</p>
            <Link href="/posts/create">
              <Button className="mt-4">
                Ersten Beitrag erstellen
              </Button>
            </Link>
          </div>
        ) : null}
        
        {isLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-20 w-full mb-4" />
              </div>
            ))}
          </div>
        )}
        
        {hasMore && posts.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMore} 
              disabled={isLoading}
            >
              {isLoading ? 'Wird geladen...' : 'Mehr laden'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 