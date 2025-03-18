export type Event = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  startTime: Date;
  endTime?: Date | null;
  locationName?: string | null;
  locationId?: string | null;
  organizer: {
    id: string;
    name: string | null;
  };
  attendees: {
    id: string;
  }[];
}; 