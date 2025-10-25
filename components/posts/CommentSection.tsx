'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  parentId?: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    replies: number;
  };
  replies?: Comment[];
};

type CommentSectionProps = {
  postId: string;
  comments: Comment[];
};

const CommentItem = ({ 
  comment, 
  postId, 
  onReplyPosted 
}: { 
  comment: Comment; 
  postId: string;
  onReplyPosted: (reply: Comment) => void;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: postId,
          content: replyContent,
          parentId: comment.id
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplyContent('');
        setShowReplyForm(false);
        onReplyPosted(newReply);
        toast.success('Antwort erfolgreich gepostet!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fehler beim Posten der Antwort');
      }
    } catch (error) {
      console.error('Fehler beim Absenden der Antwort:', error);
      toast.error('Fehler beim Posten der Antwort');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b dark:border-gray-700 last:border-0 py-4">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="relative h-10 w-10 rounded-full overflow-hidden">
            <Image
              src={comment.author.image || '/images/default-avatar.png'}
              alt={comment.author.name || 'Anonym'}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center mb-1">
            <Link href={`/profile/${comment.author.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline mr-2">
              {comment.author.name || 'Anonym'}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(new Date(comment.createdAt))}
            </span>
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            {comment.content}
          </div>
          <div className="mt-2">
            {session?.user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Antworten
              </Button>
            )}
          </div>
          
          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Schreibe eine Antwort..."
                className="w-full resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Wird gepostet...' : 'Antwort posten'}
                </Button>
              </div>
            </form>
          )}
          
          {comment._count?.replies && comment._count.replies > 0 && (
            <div className="mt-3 ml-8 text-sm text-blue-600 dark:text-blue-400">
              <Link href={`/posts/${slug || postId}/comments/${comment.id}`}>
                {comment._count.replies} {comment._count.replies === 1 ? 'Antwort' : 'Antworten'} anzeigen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const { data: session } = useSession();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: commentContent,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setCommentContent('');
        setComments(prevComments => [newComment, ...prevComments]);
        toast.success('Kommentar erfolgreich gepostet!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fehler beim Posten des Kommentars');
      }
    } catch (error) {
      console.error('Fehler beim Absenden des Kommentars:', error);
      toast.error('Fehler beim Posten des Kommentars');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update comments state when props change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleReplyPosted = (reply: Comment) => {
    // Update the parent comment's reply count
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === reply.parentId 
          ? {
              ...comment, 
              _count: { 
                replies: (comment._count?.replies || 0) + 1 
              }
            }
          : comment
      )
    );
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Kommentare</h3>
      
      {session?.user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            placeholder="Schreibe einen Kommentar..."
            className="w-full resize-none"
            rows={4}
            disabled={isSubmitting}
          />
          <div className="mt-2 flex justify-end">
            <Button 
              type="submit"
              disabled={!commentContent.trim() || isSubmitting}
            >
              {isSubmitting ? 'Wird gepostet...' : 'Kommentar posten'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <p className="text-center text-gray-600 dark:text-gray-300">
            <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Melde dich an
            </Link>, um an der Diskussion teilzunehmen
          </p>
        </div>
      )}
      
      <div className="divide-y dark:divide-gray-700">
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postId={postId} 
              onReplyPosted={handleReplyPosted}
            />
          ))
        ) : (
          <p className="py-4 text-gray-500 dark:text-gray-400 text-center">
            Noch keine Kommentare. Sei der Erste, der einen Kommentar hinterlässt!
          </p>
        )}
      </div>
    </div>
  );
} 