import { useQuery } from "@tanstack/react-query";

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  image?: string;
  organizerId: string;
  groupId?: string;
  locationId?: string;
  isRecurring?: boolean;
  group?: {
    id: string;
    name: string;
    image: string;
  };
  location?: {
    id: string;
    name: string;
    address: string;
  };
  organizer?: {
    id: string;
    name: string;
    image: string;
  };
  isAttending?: boolean;
}

// Fetch calendar events for the logged-in user
// Updated to accept start and end dates instead of just days
const fetchCalendarEvents = async (options: { 
  days?: number;
  startDate?: Date; 
  endDate?: Date;
}): Promise<Event[]> => {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append("days", options.days.toString());
  }
  
  if (options.startDate) {
    params.append("startDate", options.startDate.toISOString());
  }
  
  if (options.endDate) {
    params.append("endDate", options.endDate.toISOString());
  }
  
  const response = await fetch(`/api/events/calendar?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch calendar events");
  }
  
  return response.json();
};

// Hook to fetch calendar events
// Updated to accept more flexible parameters
export function useCalendarEvents(options: {
  days?: number;
  startDate?: Date;
  endDate?: Date;
} = { days: 30 }) {
  return useQuery({
    queryKey: ["calendarEvents", options],
    queryFn: () => fetchCalendarEvents(options),
  });
}

export default useCalendarEvents; 