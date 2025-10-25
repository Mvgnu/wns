import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Types
interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sport: string;
  sports?: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  members: any[];
  groupTags?: string[];
  activityLevel?: 'low' | 'medium' | 'high';
  entryRules?: any;
  settings?: any;
}

// API functions
const fetchGroups = async (): Promise<Group[]> => {
  const response = await fetch("/api/groups");
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  return response.json();
};

const fetchGroupById = async (id: string): Promise<Group> => {
  const response = await fetch(`/api/groups/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch group with id ${id}`);
  }
  return response.json();
};

const createGroup = async (data: Omit<Group, "id" | "createdAt" | "updatedAt" | "members">): Promise<Group> => {
  console.log("Creating group with data:", JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Group creation failed with status:", response.status);
      console.error("Error response:", errorText);
      let errorMessage = "Failed to create group";
      
      try {
        // Try to parse the error as JSON
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          if (Array.isArray(errorJson.error)) {
            // If it's a validation error array
            errorMessage = errorJson.error.map((err: any) => 
              `${err.path.join('.')}: ${err.message}`
            ).join('; ');
          } else {
            // If it's a simple error message
            errorMessage = errorJson.error;
          }
        }
      } catch (e) {
        // If it's not JSON, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error("Group creation exception:", error);
    throw error;
  }
};

const updateGroup = async ({ 
  id, 
  data 
}: { 
  id: string; 
  data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>
}): Promise<Group> => {
  const response = await fetch(`/api/groups/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to update group with id ${id}`);
  }
  
  return response.json();
};

const deleteGroup = async (id: string): Promise<void> => {
  const response = await fetch(`/api/groups/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to delete group with id ${id}`);
  }
};

// Hooks
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => fetchGroupById(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Group created",
        description: `${newGroup.name} has been created successfully.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups", updatedGroup.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Group updated",
        description: `${updatedGroup.name} has been updated successfully.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update group",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", variables] });
      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete group",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 