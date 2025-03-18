export default function EventSchemaScript({
  name,
  description,
  url,
  startDate,
  endDate,
  locationName,
  locationAddress,
  locationUrl,
  organizerName,
  organizerUrl,
  imageUrl,
  attendeesCount,
}: {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  locationName?: string;
  locationAddress?: string;
  locationUrl?: string;
  organizerName: string;
  organizerUrl?: string;
  imageUrl?: string;
  attendeesCount?: number;
}) {
  // Define the Event schema interface
  interface EventLocation {
    "@type": string;
    name: string;
    url: string;
    address?: {
      "@type": string;
      streetAddress: string;
    };
  }

  interface EventOrganizer {
    "@type": string;
    name: string;
    url?: string;
  }

  interface EventSchema {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    url: string;
    startDate: string;
    endDate?: string;
    location?: EventLocation;
    organizer: EventOrganizer;
    image?: string;
    attendeeCount?: number;
  }

  // Create the schema structure according to schema.org
  const schema: EventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": description,
    "url": url,
    "startDate": startDate,
    "organizer": {
      "@type": "Person",
      "name": organizerName,
    },
  };

  // Add end date if available
  if (endDate) {
    schema.endDate = endDate;
  }

  // Add location if available
  if (locationName) {
    schema.location = {
      "@type": "Place",
      "name": locationName,
      "url": locationUrl || "",
    };

    // Add address if available
    if (locationAddress) {
      schema.location.address = {
        "@type": "PostalAddress",
        "streetAddress": locationAddress,
      };
    }
  }

  // Add organizer URL if available
  if (organizerUrl) {
    schema.organizer.url = organizerUrl;
  }

  // Add image if available
  if (imageUrl) {
    schema.image = imageUrl;
  }

  // Add attendee count if available
  if (attendeesCount) {
    schema.attendeeCount = attendeesCount;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
} 