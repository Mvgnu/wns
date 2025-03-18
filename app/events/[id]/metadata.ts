import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { createEventSchema, createUGCSchema, combineSchemas } from '@/lib/schema';

// Generate metadata for event detail pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Get event data
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          sport: true,
        },
      },
      _count: {
        select: {
          attendees: true,
        },
      },
    },
  });

  if (!event) {
    return {
      title: 'Event nicht gefunden',
      description: 'Die angeforderte Veranstaltung wurde nicht gefunden',
    };
  }

  // Format event date for the description
  const eventDate = new Date(event.startTime).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Create description
  let description = `${eventDate}`;
  if (event.location?.name) {
    description += ` bei ${event.location.name}`;
  }
  if (event.group?.name) {
    description += ` • ${event.group.name}`;
  }
  if (event.description) {
    description += ` • ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`;
  }

  // Base URL for schemas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  
  // Create schema.org schemas
  const eventSchema = createEventSchema(event, baseUrl);
  
  // Add UGC schema for user-generated content
  const ugcSchema = createUGCSchema({
    type: 'Event',
    url: `${baseUrl}/events/${event.id}`,
    creator: event.organizer ? {
      name: event.organizer.name,
      url: `${baseUrl}/profile/${event.organizer.id}`,
    } : undefined,
    dateCreated: event.createdAt,
    dateModified: event.updatedAt,
  });
  
  // Combine schemas
  const schema = combineSchemas(eventSchema, ugcSchema);

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: 'article',
      url: `${baseUrl}/events/${event.id}`,
      images: [
        {
          url: event.image || `/events/${event.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [event.image || `/events/${event.id}/opengraph-image`],
    },
    alternates: {
      canonical: `${baseUrl}/events/${event.id}`,
    },
    other: {
      'og:locale': 'de_DE',
      'og:site_name': 'WNS Community',
    },
    // Include JSON-LD schema.org markup
    ...(schema && { 
      other: {
        ...schema && { 'script:ld+json': JSON.stringify(schema) }
      }
    }),
  };
} 