import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

// Types for search results
interface User {
  id: string;
  name: string;
  image?: string;
  location?: string;
  sports: string[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  images: string[];
  author: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sport: string;
  location?: string;
  _count: {
    members: number;
  };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  image?: string;
  startTime: string;
  endTime?: string;
  location?: {
    id: string;
    name: string;
    address?: string;
  };
  organizer: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    attendees: number;
  };
}

interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  type: string;
  sport: string;
  latitude: number;
  longitude: number;
  images: string[];
  rating?: number;
}

interface SearchResults {
  users?: User[];
  posts?: Post[];
  groups?: Group[];
  events?: Event[];
  locations?: Location[];
}

type SearchType = "users" | "posts" | "groups" | "events" | "locations" | undefined;

// API function for search
const searchItems = async (query: string, type?: SearchType, limit: number = 5): Promise<SearchResults> => {
  if (!query.trim()) {
    return {};
  }

  const params = new URLSearchParams({ q: query });
  if (type) params.append("type", type);
  if (limit) params.append("limit", limit.toString());

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to search");
  }
  return response.json();
};

// Hook for search functionality
export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>(undefined);
  const [limit, setLimit] = useState(5);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search", searchQuery, searchType, limit],
    queryFn: () => searchItems(searchQuery, searchType, limit),
    enabled: searchQuery.trim().length > 0,
  });

  // Handle search submission
  const handleSearch = (query: string, type?: SearchType, resultLimit?: number) => {
    setSearchQuery(query);
    if (type !== undefined) setSearchType(type);
    if (resultLimit !== undefined) setLimit(resultLimit);
  };

  // Display error toast if search fails
  if (error) {
    toast({
      title: "Search Failed",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return {
    searchResults: data || {},
    isLoading,
    handleSearch,
    searchQuery,
    searchType,
  };
} 