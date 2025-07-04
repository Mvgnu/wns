import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { createLocationSchema, createUGCSchema, combineSchemas } from '@/lib/schema';

// Generate metadata for location detail pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Get location data with reviews
  const location = await prisma.location.findUnique({
    where: { id: params.id },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          events: true,
          reviews: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  if (!location) {
    return {
      title: 'Location nicht gefunden',
      description: 'Die angeforderte Location wurde nicht gefunden',
    };
  }

  // Calculate average rating
  let averageRating = null;
  if (location.reviews.length > 0) {
    const totalRating = location.reviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = totalRating / location.reviews.length;
  }

  // Base URL for schemas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  
  // Create schema.org schemas with averageRating
  const locationSchema = createLocationSchema({
    ...location,
    averageRating,
  }, baseUrl);
  
  // Add UGC schema for user-generated content
  const ugcSchema = createUGCSchema({
    type: 'Location',
    url: `${baseUrl}/locations/${location.id}`,
    creator: location.addedBy ? {
      name: location.addedBy.name || 'Unbekannt',
      url: `${baseUrl}/profile/${location.addedBy.id}`,
    } : undefined,
    dateCreated: location.createdAt,
    dateModified: location.updatedAt,
  });
  
  // Combine schemas
  const schema = combineSchemas(locationSchema, ugcSchema);

  // Create description
  let description = `${location.name} - ${location.type}`;
  if (location.sport) {
    description += ` für ${location.sport}`;
  }
  if (location.address) {
    description += ` • ${location.address}`;
  }
  if (location.description) {
    description += `: ${location.description.substring(0, 150)}${location.description.length > 150 ? '...' : ''}`;
  }

  const title = `${location.name} | ${location.type}${location.sport ? ` für ${location.sport}` : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/locations/${location.id}`,
      images: [
        {
          url: location.images?.[0] || `/api/og?title=${encodeURIComponent(location.name)}&subtitle=${encodeURIComponent(location.type)}`,
          width: 1200,
          height: 630,
          alt: location.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [location.images?.[0] || `/api/og?title=${encodeURIComponent(location.name)}&subtitle=${encodeURIComponent(location.type)}`],
    },
    alternates: {
      canonical: `${baseUrl}/locations/${location.id}`,
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