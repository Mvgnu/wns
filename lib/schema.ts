/**
 * Schema.org utilities for generating structured data for SEO
 */

import type { Event as PrismaEvent, Group, Location, Post, User } from '@prisma/client';

// UGC indicator for user-generated content
export function createUGCSchema(props: {
  type: 'Event' | 'Group' | 'Post' | 'Location' | 'Comment';
  url: string;
  creator?: { name: string; url?: string };
  dateCreated?: Date;
  dateModified?: Date;
}) {
  const { type, url, creator, dateCreated, dateModified } = props;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'UserComments', // The main type for UGC content
    creator: creator 
      ? {
          '@type': 'Person',
          name: creator.name,
          ...(creator.url && { url: creator.url }),
        }
      : undefined,
    discussionUrl: url,
    dateCreated: dateCreated?.toISOString(),
    dateModified: dateModified?.toISOString(),
    mainContentOfPage: {
      '@type': type,
      // We don't add more details here as they will be provided
      // in the main schema for the content
    }
  };
}

// Generic metadata for different content types
export function createEventSchema(event: PrismaEvent & {
  organizer?: Pick<User, 'id' | 'name'>;
  location?: Pick<Location, 'id' | 'name' | 'address' | 'latitude' | 'longitude'>;
  group?: Pick<Group, 'id' | 'name'>;
  _count?: { attendees: number };
}, baseUrl: string) {
  const eventUrl = `${baseUrl}/events/${event.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || undefined,
    startDate: event.startTime.toISOString(),
    ...(event.endTime && { endDate: event.endTime.toISOString() }),
    image: event.image || undefined,
    url: eventUrl,
    organizer: event.organizer
      ? {
          '@type': 'Person',
          name: event.organizer.name,
          url: `${baseUrl}/profile/${event.organizer.id}`,
        }
      : undefined,
    location: event.location
      ? {
          '@type': 'Place',
          name: event.location.name,
          address: event.location.address || undefined,
          ...(event.location.latitude && event.location.longitude
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                },
              }
            : {}),
        }
      : undefined,
    eventAttendanceMode: 'OfflineEventAttendanceMode',
    ...(event.group
      ? {
          eventStatus: 'EventScheduled',
          organizer: {
            '@type': 'Organization',
            name: event.group.name,
            url: `${baseUrl}/groups/${event.group.id}`,
          },
        }
      : {}),
    ...(event._count
      ? {
          attendee: {
            '@type': 'audience',
            audienceType: 'Enthusiasts',
            audienceSize: event._count.attendees,
          },
        }
      : {}),
  };
}

export function createGroupSchema(group: Group & {
  owner?: Pick<User, 'id' | 'name'>;
  _count?: { members: number; posts: number; events: number };
}, baseUrl: string) {
  const groupUrl = `${baseUrl}/groups/${group.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: group.name,
    description: group.description || undefined,
    image: group.image || undefined,
    url: groupUrl,
    founder: group.owner
      ? {
          '@type': 'Person',
          name: group.owner.name,
          url: `${baseUrl}/profile/${group.owner.id}`,
        }
      : undefined,
    member: group._count
      ? {
          '@type': 'OrganizationRole',
          memberOf: {
            '@type': 'Organization',
            name: group.name,
          },
          numberOfMembers: group._count.members,
        }
      : undefined,
    ...(group.sport
      ? {
          knowsAbout: group.sport,
        }
      : {}),
  };
}

export function createLocationSchema(location: Location & {
  addedBy?: Pick<User, 'id' | 'name'>;
  _count?: { events: number; reviews: number };
}, baseUrl: string) {
  const locationUrl = `${baseUrl}/locations/${location.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: location.name,
    description: location.description || undefined,
    image: location.images?.[0] || undefined,
    url: locationUrl,
    ...(location.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: location.address,
          },
        }
      : {}),
    ...(location.latitude && location.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : {}),
    ...(location.sport
      ? {
          amenityFeature: {
            '@type': 'LocationFeatureSpecification',
            name: location.sport,
            value: true,
          },
        }
      : {}),
    ...(location._count && location._count.reviews > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: location.rating || 0,
            reviewCount: location._count.reviews,
          },
        }
      : {}),
  };
}

export function createPostSchema(post: Post & {
  author?: Pick<User, 'id' | 'name'>;
  group?: Pick<Group, 'id' | 'name'>;
}, baseUrl: string) {
  const postUrl = `${baseUrl}/posts/${post.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    articleBody: post.content || undefined,
    image: post.images?.[0] || undefined,
    url: postUrl,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author.name,
          url: `${baseUrl}/profile/${post.author.id}`,
        }
      : undefined,
    publisher: post.group
      ? {
          '@type': 'Organization',
          name: post.group.name,
          url: `${baseUrl}/groups/${post.group.id}`,
        }
      : {
          '@type': 'Organization',
          name: 'WNS Community',
          url: baseUrl,
        },
  };
}

// Helper function to combine schema objects for a page
export function combineSchemas(...schemas: any[]) {
  // Filter out undefined or null schemas
  const validSchemas = schemas.filter(schema => schema);
  
  if (validSchemas.length === 0) {
    return null;
  }
  
  if (validSchemas.length === 1) {
    return validSchemas[0];
  }
  
  return {
    '@context': 'https://schema.org',
    '@graph': validSchemas.map(schema => {
      // Remove @context from individual schemas when combining
      const { ['@context']: _, ...rest } = schema;
      return rest;
    }),
  };
} 