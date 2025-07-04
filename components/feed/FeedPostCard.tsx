'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Heart, MessageCircle, Share, MoreHorizontal, Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { FeedPostAuthor, FeedPostReply, FeedPostWithRelations } from '@/types/feed';

interface FeedPostCardProps {
  post: FeedPostWithRelations;
  onLike: (postId: string, liked: boolean) => void;
  onReplyAdded: (postId: string, reply: FeedPostReply) => void;
  onReplyRemoved: (postId: string, replyId: string) => void;
}

export default function FeedPostCard({
  post,
  onLike,
  onReplyAdded,
  onReplyRemoved
}: FeedPostCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState<boolean>(post.userHasLiked || false);
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState<boolean>(false);
  
  // Format the creation date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: de
  });
  const fullDate = format(new Date(post.createdAt), 'PPpp', { locale: de });
  
  // Handle like button click
  const handleLike = async () => {
    if (!session?.user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to like posts",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmittingLike(true);
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/feed/${post.id}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        onLike(post.id, newLikedState);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to like post');
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to like post",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingLike(false);
    }
  };
  
  // Handle reply submission
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to reply to posts",
        variant: "destructive"
      });
      return;
    }
    
    if (replyContent.trim() === '') {
      toast({
        title: "Empty reply",
        description: "Please enter some content for your reply",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmittingReply(true);
    
    try {
      const response = await fetch(`/api/feed/${post.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: replyContent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add the new reply to the UI
        onReplyAdded(post.id, data.reply);
        
        // Clear the reply input
        setReplyContent('');
        
        // Make sure replies are visible
        setShowReplies(true);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit reply",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  // Handle reply deletion
  const handleDeleteReply = async (replyId: string) => {
    if (!session?.user) {
      return;
    }
    
    try {
      const response = await fetch(`/api/feed/${post.id}/reply?replyId=${replyId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onReplyRemoved(post.id, replyId);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Failed to delete reply:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete reply",
        variant: "destructive"
      });
    }
  };
  
  // Generate target badges
  const renderTargetBadges = () => {
    return post.targets.map(target => {
      let href = '';
      let variant: 'default' | 'secondary' | 'outline' = 'outline';
      
      switch (target.targetType) {
        case 'user':
          href = `/profile/${target.targetId}`;
          variant = 'default';
          break;
        case 'group':
          href = `/groups/${target.targetId}`;
          variant = 'secondary';
          break;
        case 'location':
          href = `/locations/${target.targetId}`;
          variant = 'outline';
          break;
        case 'event':
          href = `/events/${target.targetId}`;
          variant = 'outline';
          break;
      }
      
      return (
        <Link href={href} key={`${target.targetType}-${target.targetId}`}>
          <Badge variant={variant} className="mr-1 cursor-pointer">
            {target.name || getTargetTypeName(target.targetType)}
          </Badge>
        </Link>
      );
    });
  };
  
  // Get friendly name for target type
  const getTargetTypeName = (type: string) => {
    switch (type) {
      case 'user':
        return 'Profile';
      case 'group':
        return 'Group';
      case 'location':
        return 'Location';
      case 'event':
        return 'Event';
      default:
        return type;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <Link href={`/profile/${post.author.id}`} className="flex-shrink-0">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={post.author.image || undefined} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center">
            <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline mr-2">
              {post.author.name}
            </Link>
            <span className="text-xs text-muted-foreground" title={fullDate}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-1">
            {renderTargetBadges()}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  text: post.content,
                  url: `/feed/post/${post.id}`
                }).catch(err => console.error('Error sharing:', err));
              } else {
                navigator.clipboard.writeText(`${window.location.origin}/feed/post/${post.id}`)
                  .then(() => {
                    toast({
                      title: "Link copied",
                      description: "Post link copied to clipboard",
                      variant: "default"
                    });
                  })
                  .catch(err => console.error('Error copying:', err));
              }
            }}>
              Share post
            </DropdownMenuItem>
            {session?.user?.id === post.author.id && (
              <DropdownMenuItem className="text-red-500">
                Delete post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="pt-2">
        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        <p className="whitespace-pre-line">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mt-4">
            <img 
              src={post.imageUrl} 
              alt="Post image" 
              className="rounded-md max-h-96 w-auto mx-auto"
            />
          </div>
        )}
        
        {post.videoUrl && (
          <div className="mt-4 aspect-video">
            <iframe
              src={post.videoUrl}
              className="w-full h-full rounded-md"
              allowFullScreen
              title="Embedded video"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              disabled={isSubmittingLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likeCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.replyCount}</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  text: post.content,
                  url: `/feed/post/${post.id}`
                }).catch(err => console.error('Error sharing:', err));
              } else {
                navigator.clipboard.writeText(`${window.location.origin}/feed/post/${post.id}`)
                  .then(() => {
                    toast({
                      title: "Link copied",
                      description: "Post link copied to clipboard",
                      variant: "default"
                    });
                  })
                  .catch(err => console.error('Error copying:', err));
              }
            }}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        {showReplies && (
          <div className="w-full mt-2">
            <Separator className="my-2" />
            
            {/* Reply form */}
            {session?.user && (
              <form onSubmit={handleSubmitReply} className="flex flex-col md:flex-row gap-2 mb-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 min-h-[60px]"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="self-end md:self-stretch"
                  disabled={isSubmittingReply}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
            
            {/* Replies list */}
            <div className="space-y-4">
              {post.replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet. Be the first to reply!</p>
              ) : (
                post.replies.map(reply => (
                  <div key={reply.id} className="flex gap-2">
                    <Link href={`/profile/${reply.author.id}`} className="flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author.image || undefined} />
                        <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="bg-muted p-2 rounded-md">
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${reply.author.id}`} className="font-semibold text-sm hover:underline">
                            {reply.author.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: de })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{reply.content}</p>
                      </div>
                      
                      {session?.user?.id === reply.author.id && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground"
                          onClick={() => handleDeleteReply(reply.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 