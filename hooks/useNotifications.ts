import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Types
interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  relatedId?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// API functions
const fetchNotifications = async (
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (unreadOnly) {
    params.append("unread", "true");
  }
  
  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
};

const markAsRead = async (id?: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(id ? { id } : { all: true }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to mark notification(s) as read");
  }
  
  return response.json();
};

const deleteNotification = async (id?: string): Promise<{ success: boolean; message: string }> => {
  const params = new URLSearchParams();
  if (id) {
    params.append("id", id);
  } else {
    params.append("all", "true");
  }
  
  const response = await fetch(`/api/notifications?${params.toString()}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete notification(s)");
  }
  
  return response.json();
};

// Hooks
export function useNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ["notifications", page, limit, unreadOnly],
    queryFn: () => fetchNotifications(page, limit, unreadOnly),
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification(s) marked as read",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification(s) deleted",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 