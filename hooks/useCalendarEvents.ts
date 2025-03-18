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
const fetchCalendarEvents = async (days: number = 30): Promise<Event[]> => {
  const response = await fetch(`/api/events/calendar?days=${days}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch calendar events");
  }
  
  return response.json();
};

// Hook to fetch calendar events
export function useCalendarEvents(days: number = 30) {
  return useQuery({
    queryKey: ["calendarEvents", days],
    queryFn: () => fetchCalendarEvents(days),
  });
}

export default useCalendarEvents; 