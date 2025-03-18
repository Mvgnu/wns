import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Cache configuration
const CACHE_TIME = 1000 * 60 * 60; // 1 hour
const STALE_TIME = 1000 * 60 * 15; // 15 minutes

// Types for Location data
interface Location {
  id: string;
  name: string;
  description: string;
  type: string;
  sport: string;
  latitude: number;
  longitude: number;
  address?: string;
  images: string[];
  rating?: number;
  createdAt: string;
  updatedAt: string;
  isLineBased: boolean;
  coordinates?: any;
  addedById: string;
  addedBy: {
    id: string;
    name: string;
    image?: string;
  };
  _count?: {
    reviews: number;
    events: number;
  };
}

interface LocationsResponse {
  locations: Location[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

interface LocationReview {
  id: string;
  rating: number;
  comment?: string;
  locationId: string;
  userId: string;
  createdAt: string;
}

// API functions
const fetchLocations = async (
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, any>
): Promise<LocationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
  }

  const response = await fetch(`/api/locations?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }
  return response.json();
};

const fetchLocationById = async (id: string): Promise<Location> => {
  const response = await fetch(`/api/locations?id=${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch location");
  }
  return response.json();
};

const fetchLocationReviews = async (locationId: string): Promise<LocationReview[]> => {
  const response = await fetch(`/api/locations/${locationId}/reviews`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reviews for location ${locationId}`);
  }
  return response.json();
};

const createLocation = async (data: Partial<Location>): Promise<Location> => {
  const response = await fetch("/api/locations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create location");
  }

  return response.json();
};

const updateLocation = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Location>;
}): Promise<Location> => {
  const response = await fetch(`/api/locations?id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update location");
  }

  return response.json();
};

const deleteLocation = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`/api/locations?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete location");
  }

  return response.json();
};

const addReview = async (data: Omit<LocationReview, "id" | "createdAt">): Promise<LocationReview> => {
  const response = await fetch(`/api/locations/${data.locationId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to add review");
  }
  
  return response.json();
};

// React Query hooks
export function useLocations(
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, any>
) {
  return useQuery({
    queryKey: ["locations", page, limit, filters],
    queryFn: () => fetchLocations(page, limit, filters),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ["location", id],
    queryFn: () => fetchLocationById(id),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: !!id,
  });
}

export function useLocationReviews(locationId: string) {
  return useQuery({
    queryKey: ["locations", locationId, "reviews"],
    queryFn: () => fetchLocationReviews(locationId),
    enabled: !!locationId,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Success",
        description: "Location created successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create location",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", data.id] });
      toast({
        title: "Success",
        description: "Location updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.removeQueries({ queryKey: ["location", variables] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive",
      });
    },
  });
}

export function useAddLocationReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addReview,
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({ queryKey: ["locations", newReview.locationId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["locations", newReview.locationId] });
      toast({
        title: "Review added",
        description: "Your review has been added successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 