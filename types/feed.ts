// Base types that mirror Prisma models
export type FeedPost = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  authorId: string;
};

export type FeedPostTarget = {
  id: string;
  targetType: 'user' | 'group' | 'location' | 'event';
  targetId: string;
  postId: string;
  createdAt: string;
};

export type FeedPostLike = {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
};

export type FeedPostReply = {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
};

// Author type for API responses
export type FeedPostAuthor = {
  id: string;
  name: string;
  image: string | null;
};

// Extended target with entity name and image
export type FeedPostTargetWithEntity = FeedPostTarget & {
  name?: string;
  image?: string | null;
};

// Extended post type for API responses
export type FeedPostWithRelations = FeedPost & {
  author: FeedPostAuthor;
  targets: FeedPostTargetWithEntity[];
  likes: FeedPostLike[];
  likeCount: number;
  replies: (FeedPostReply & { author: FeedPostAuthor })[];
  replyCount: number;
  userHasLiked?: boolean;
};

// Type for post creation
export type CreateFeedPostInput = {
  title: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  targets: {
    targetType: 'user' | 'group' | 'location' | 'event';
    targetId: string;
  }[];
};

// Type for target entities in UI
export type TargetEntity = {
  id: string;
  name: string;
  image?: string | null;
  type: 'user' | 'group' | 'location' | 'event';
  isPublic?: boolean;
}; 