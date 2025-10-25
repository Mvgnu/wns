import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';
import FeedPostCard from '@/components/feed/FeedPostCard';
import { FeedPost } from '@/components/feed/FeedPostList';

interface SingleFeedPostPageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function SingleFeedPostPage({ params }: SingleFeedPostPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/feed">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
        </div>
        
        <Suspense fallback={<PostSkeleton />}>
          <FeedPostContent postId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function FeedPostContent({ postId }: { postId: string }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  try {
    // Fetch the post with all its details
    const post = await prisma.feedPost.findUnique({
      where: {
        id: postId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        targets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            group: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            location: {
              select: {
                id: true,
                name: true,
                images: true
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                image: true
              }
            }
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        replies: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    });
    
    if (!post) {
      notFound();
    }
    
    // Check user access to this post
    if (!userId) {
      // Guest access check - this will depend on your requirements
      // For now, we're allowing viewing for all posts
    } else {
      // User specific checks could be implemented here if needed
    }
    
    // Format the post for the component
    const formattedPost: FeedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.name,
        image: post.author.image
      },
      targets: post.targets.map(target => {
        let name = '';
        let image = null;
        
        if (target.targetType === 'user' && target.user) {
          name = target.user.name;
          image = target.user.image;
        } else if (target.targetType === 'group' && target.group) {
          name = target.group.name;
          image = target.group.image;
        } else if (target.targetType === 'location' && target.location) {
          name = target.location.name;
          image = target.location.images?.[0] || null;
        } else if (target.targetType === 'event' && target.event) {
          name = target.event.title;
          image = target.event.image;
        }
        
        return {
          id: target.id,
          targetType: target.targetType as any,
          targetId: target.targetId,
          name,
          image
        };
      }),
      likes: post.likes.map(like => ({
        id: like.id,
        userId: like.userId,
        userName: like.user.name,
        userImage: like.user.image
      })),
      likeCount: post._count.likes,
      replies: post.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        author: {
          id: reply.author.id,
          name: reply.author.name,
          image: reply.author.image
        }
      })),
      replyCount: post._count.replies,
      userHasLiked: userId ? post.likes.some(like => like.userId === userId) : false
    };
    
    // Client-side component to handle interactions
    return (
      <FeedPostCard
        post={formattedPost}
        onLike={() => {}}
        onReplyAdded={() => {}}
        onReplyRemoved={() => {}}
      />
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">
          There was a problem loading this post. Please try again later.
        </p>
      </div>
    );
  }
}

function PostSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-4 w-[90%] mb-2" />
        <Skeleton className="h-4 w-[95%] mb-2" />
        <Skeleton className="h-4 w-[80%] mb-2" />
        <Skeleton className="h-4 w-[85%] mb-2" />
        <Skeleton className="h-4 w-[60%] mb-6" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
} 