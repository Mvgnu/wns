import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LocationPageClient from '@/app/locations/[id]/LocationPageClient';

type Props = {
  params: {
    id: string;
  };
};

// Generate metadata for SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const locationId = params.id;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { 
      name: true,
      description: true,
      type: true,
      sport: true,
      images: true,
      addedBy: {
        select: {
          name: true
        }
      }
    }
  });

  if (!location) {
    return {
      title: 'Ort nicht gefunden',
      description: 'Der gesuchte Ort existiert nicht',
    };
  }

  return {
    title: location.name,
    description: location.description || `Ein ${location.type} für ${location.sport}`,
    openGraph: {
      type: 'website',
      title: location.name,
      description: location.description || `Ein ${location.type} für ${location.sport}`,
      images: [
        {
          url: location.images?.[0] || '/images/default-location.jpg',
          width: 1200,
          height: 630,
          alt: location.name,
        },
      ],
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const locationId = params.id;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      sport: true,
      latitude: true,
      longitude: true,
      address: true,
      images: true,
      rating: true,
      createdAt: true,
      updatedAt: true,
      addedBy: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      },
      events: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          image: true,
          organizer: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 3,
      },
    },
  });

  if (!location) {
    notFound();
  }

  const averageRating =
    location.reviews.length > 0
      ? location.reviews.reduce((sum, review) => sum + review.rating, 0) /
        location.reviews.length
      : location.rating || 0;

  return (
    <LocationPageClient location={location} averageRating={averageRating} />
  );
}