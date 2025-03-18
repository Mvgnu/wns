import Image from 'next/image';
import Link from 'next/link';
import { formatDate, truncateText } from '@/lib/utils';

type Author = {
  id: string;
  name: string | null;
  image: string | null;
};

type Like = {
  id: string;
  userId: string;
};

type Comment = {
  id: string;
  content: string;
  authorId: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: Author;
  likes: Like[];
  comments: Comment[];
  images: string[];
};

type GroupPostsListProps = {
  posts: Post[];
  groupId: string;
  userId?: string;
  isMember: boolean;
};

export default function GroupPostsList({ posts, groupId, userId, isMember }: GroupPostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No posts yet. {isMember ? 'Be the first to share with this group!' : 'Join the group to share posts!'}</p>
        {isMember && (
          <Link href={`/posts/create?groupId=${groupId}`} className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
            Create a post
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="border-b dark:border-gray-700 last:border-0">
          <Link href={`/posts/${post.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={post.author.image || '/images/default-avatar.png'}
                    alt={post.author.name || 'Anonymous'}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100 mr-2 truncate">
                    {post.author.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-white">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {truncateText(post.content.replace(/<[^>]*>/g, ''), 150)}
                </p>
                
                {post.images && post.images.length > 0 && (
                  <div className="flex -mx-1 mt-2 overflow-hidden">
                    {post.images.slice(0, 3).map((image, index) => (
                      <div key={index} className="px-1 w-1/3">
                        <div className="relative h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={image}
                            alt={`Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                    {post.images.length > 3 && (
                      <div className="px-1 w-1/3">
                        <div className="relative h-20 flex items-center justify-center rounded overflow-hidden bg-gray-900 text-white">
                          <span>+{post.images.length - 3} more</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="mr-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                    </svg>
                    <span>{post.likes.length} likes</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
                    </svg>
                    <span>{post.comments.length} comments</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 