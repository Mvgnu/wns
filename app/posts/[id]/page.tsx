import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
// Remove unused imports
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CommentSection from '@/components/posts/CommentSection';
import { prisma } from '@/lib/prisma';

type Props = {
  params: {
    id: string;
  };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { author: true },
  });

  if (!post) {
    return {
      title: 'Beitrag nicht gefunden',
      description: 'Der gesuchte Beitrag existiert nicht',
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.content.substring(0, 160),
      authors: [post.author.name || 'Anonym'],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      group: true,
      comments: {
        include: {
          author: true,
        },
        where: { parentId: null }, // Only get top-level comments
        orderBy: { createdAt: 'desc' },
      },
      likes: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
              <Image
                src={post.author.image || '/images/default-avatar.png'}
                alt={post.author.name || 'Anonym'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <Link href={`/profile/${post.author.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {post.author.name || 'Anonym'}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(post.createdAt)}
                {post.group && (
                  <> · Gepostet in <Link href={`/groups/${post.group.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{post.group.name}</Link></>
                )}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          
          <div className="prose dark:prose-invert max-w-none mb-6" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
              {post.images.map((image, index) => (
                <div key={index} className="relative h-60 rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`Bild ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {post.videos.length > 0 && (
            <div className="space-y-4 my-6">
              {post.videos.map((video, index) => (
                <div key={index} className="aspect-video">
                  <video 
                    src={video}
                    controls
                    className="w-full h-full rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="mr-4">
              <span>{post.likes.length} Likes</span>
            </div>
            <div>
              <span>{post.comments.length} Kommentare</span>
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700">
          <CommentSection postId={post.id} comments={post.comments} />
        </div>
      </div>
    </div>
  );
} 