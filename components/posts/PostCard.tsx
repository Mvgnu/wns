"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Share, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  groupId?: string;
  groupName?: string;
  commentCount: number;
  likeCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  onDelete?: () => void;
}

export default function PostCard({
  id,
  title,
  content,
  images,
  videos,
  createdAt,
  author,
  groupId,
  groupName,
  commentCount,
  likeCount,
  isLiked = false,
  isAuthor = false,
  onLike,
  onUnlike,
  onDelete,
}: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const createdDate = new Date(createdAt);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: de });
  
  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              {author.image ? (
                <Image
                  src={author.image}
                  alt={author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  {author.name.charAt(0)}
                </div>
              )}
            </Avatar>
            <div>
              <div className="font-medium">
                <Link href={`/profile/${author.id}`} className="hover:underline">
                  {author.name}
                </Link>
                {groupId && groupName && (
                  <>
                    <span className="mx-1 text-muted-foreground">in</span>
                    <Link href={`/groups/${groupId}`} className="hover:underline text-primary">
                      {groupName}
                    </Link>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{timeAgo}</div>
            </div>
          </div>
          
          {isAuthor && (
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {/* Dropdown menu would go here */}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <CardTitle className="mb-2 text-xl">
          <Link href={`/posts/${id}`} className="hover:underline">
            {title}
          </Link>
        </CardTitle>
        
        <div className={`prose prose-sm dark:prose-invert max-w-none ${!showFullContent && 'line-clamp-3'}`}>
          {content}
        </div>
        
        {content.length > 150 && (
          <button 
            onClick={toggleContent} 
            className="text-sm text-primary hover:underline mt-1"
          >
            {showFullContent ? 'Weniger anzeigen' : 'Mehr lesen'}
          </button>
        )}
        
        {(images.length > 0 || videos.length > 0) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={`image-${index}`} className="relative aspect-square rounded-md overflow-hidden">
                <Image
                  src={image}
                  alt={`Bild ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            
            {videos.map((video, index) => (
              <div key={`video-${index}`} className="relative aspect-video rounded-md overflow-hidden">
                <video
                  src={video}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1"
            onClick={isLiked ? onUnlike : onLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likeCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1"
            asChild
          >
            <Link href={`/posts/${id}#comments`}>
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount}</span>
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1"
          >
            <Share className="h-4 w-4" />
            <span>Teilen</span>
          </Button>
        </div>
        
        {isAuthor && onDelete && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 hover:text-red-700"
            onClick={onDelete}
          >
            Löschen
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 