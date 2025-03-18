import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Types
interface Profile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  sports: string[];
  createdAt: string;
  updatedAt: string;
}

// API functions
const fetchProfile = async (userId: string): Promise<Profile> => {
  const response = await fetch(`/api/profile/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  return response.json();
};

const fetchMyProfile = async (): Promise<Profile> => {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch your profile");
  }
  return response.json();
};

const updateProfile = async (data: Partial<Omit<Profile, "id" | "email" | "createdAt" | "updatedAt">>): Promise<Profile> => {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update profile");
  }
  
  return response.json();
};

// Hooks
export function useProfile(userId: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchMyProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", updatedProfile.id] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 