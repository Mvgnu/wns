import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Types
interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  groupId?: string;
  locationId?: string;
  attendees?: any[];
}

// API functions
const fetchEvents = async (): Promise<Event[]> => {
  const response = await fetch("/api/events");
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
};

const fetchEventById = async (id: string): Promise<Event> => {
  const response = await fetch(`/api/events/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch event with id ${id}`);
  }
  return response.json();
};

const createEvent = async (data: Omit<Event, "id" | "createdAt" | "updatedAt" | "attendees">): Promise<Event> => {
  console.log("Sending event data to API:", JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Event creation failed with status:", response.status);
      console.error("Error response:", errorText);
      let errorMessage = "Failed to create event";
      
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
    console.error("Event creation exception:", error);
    throw error;
  }
};

const updateEvent = async ({ 
  id, 
  data 
}: { 
  id: string; 
  data: Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>
}): Promise<Event> => {
  const response = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to update event with id ${id}`);
  }
  
  return response.json();
};

const deleteEvent = async (id: string): Promise<void> => {
  const response = await fetch(`/api/events/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to delete event with id ${id}`);
  }
};

const attendEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(`/api/events/${eventId}/attend`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to attend event with id ${eventId}`);
  }
};

const leaveEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(`/api/events/${eventId}/leave`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to leave event with id ${eventId}`);
  }
};

// Hooks
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchEventById(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEvent,
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event created",
        description: `${newEvent.title} has been created successfully.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events", updatedEvent.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event updated",
        description: `${updatedEvent.title} has been updated successfully.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.removeQueries({ queryKey: ["events", variables] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAttendEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendEvent,
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event joined",
        description: "You have successfully joined the event.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: leaveEvent,
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event left",
        description: "You have successfully left the event.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 