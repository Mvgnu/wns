import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  groupId?: string;
  author?: any;
  comments?: Comment[];
  likes?: Like[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  parentId?: string;
  author?: any;
  replies?: Comment[];
}

interface Like {
  id: string;
  createdAt: string;
  userId: string;
  postId: string;
}

// API functions
const fetchPosts = async (): Promise<Post[]> => {
  const response = await fetch("/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
};

const fetchPostById = async (id: string): Promise<Post> => {
  const response = await fetch(`/api/posts/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch post with id/slug ${id}`);
  }
  return response.json();
};

const fetchPostsByGroup = async (groupId: string): Promise<Post[]> => {
  const response = await fetch(`/api/groups/${groupId}/posts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts for group ${groupId}`);
  }
  return response.json();
};

const createPost = async (data: Omit<Post, "id" | "createdAt" | "updatedAt" | "author" | "comments" | "likes">): Promise<Post> => {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create post");
  }
  
  return response.json();
};

const updatePost = async ({ 
  id, 
  data 
}: { 
  id: string; 
  data: Partial<Omit<Post, "id" | "createdAt" | "updatedAt" | "authorId" | "author" | "comments" | "likes">>
}): Promise<Post> => {
  const response = await fetch(`/api/posts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to update post with id ${id}`);
  }
  
  return response.json();
};

const deletePost = async (id: string): Promise<void> => {
  const response = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to delete post with id ${id}`);
  }
};

const likePost = async (postId: string): Promise<void> => {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to like post with id ${postId}`);
  }
};

const unlikePost = async (postId: string): Promise<void> => {
  const response = await fetch(`/api/posts/${postId}/unlike`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to unlike post with id ${postId}`);
  }
};

const addComment = async (data: { postId: string; content: string; parentId?: string }): Promise<Comment> => {
  const response = await fetch(`/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to add comment");
  }
  
  return response.json();
};

// Hooks
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: () => fetchPostById(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

export function useGroupPosts(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "posts"],
    queryFn: () => fetchPostsByGroup(groupId),
    enabled: !!groupId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (newPost.groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", newPost.groupId, "posts"] });
      }
      toast({
        title: "Post created",
        description: "Your post has been created successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePost,
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ["posts", updatedPost.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (updatedPost.groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", updatedPost.groupId, "posts"] });
      }
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.removeQueries({ queryKey: ["posts", variables] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: likePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      toast({
        title: "Post liked",
        description: "You have liked this post.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to like post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: unlikePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      toast({
        title: "Post unliked",
        description: "You have unliked this post.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unlike post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addComment,
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ["posts", newComment.postId] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 