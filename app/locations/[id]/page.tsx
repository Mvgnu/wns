import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LocationDetailClient from './components/LocationDetailClient';
import { allSports } from '@/lib/sportsData';

interface LocationPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const location = await prisma.location.findUnique({
    where: { id: params.id },
    select: { name: true, sport: true, type: true }
  });

  if (!location) {
    return {
      title: 'Location nicht gefunden',
      description: 'Die angeforderte Location existiert nicht.',
    };
  }

  // Find the sport label from the sport code
  const sportObj = allSports.find(s => s.value === location.sport);
  const sportLabel = sportObj?.label || location.sport;

  return {
    title: `${location.name} - Sport Location | WNS Community`,
    description: `Entdecke ${location.name}, eine ${location.type} für ${sportLabel}. Bewertungen, Details und Events an dieser Location.`,
    openGraph: {
      title: `${location.name} - Sport Location | WNS Community`,
      description: `Entdecke ${location.name}, eine ${location.type} für ${sportLabel}. Bewertungen, Details und Events an dieser Location.`,
    },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const location = await prisma.location.findUnique({
    where: { id: params.id },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      events: {
        where: {
          startTime: {
            gte: new Date(),
          },
          // Only show events from public groups or where user is a member
          OR: [
            { group: { isPrivate: false } },
            { group: null },
            { 
              group: { 
                isPrivate: true,
                OR: userId ? [
                  { ownerId: userId },
                  { members: { some: { id: userId } } }
                ] : []
              } 
            }
          ]
        },
        orderBy: {
          startTime: 'asc',
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              isPrivate: true
            }
          }
        },
        take: 5,
      },
    },
  });

  if (!location) {
    notFound();
  }

  // Calculate average rating
  const averageRating =
    location.reviews.length > 0
      ? location.reviews.reduce((acc, review) => acc + review.rating, 0) / location.reviews.length
      : 0;

  // Find the sport label from the sport code
  const sportObj = allSports.find(s => s.value === location.sport);
  const sportLabel = sportObj?.label || location.sport;

  // Create a properly typed location object without the problematic coordinates field
  const typedLocation = {
    ...location,
    coordinates: Array.isArray(location.coordinates) ? location.coordinates : undefined
  };

  return (
    <LocationDetailClient 
      location={typedLocation} 
      averageRating={averageRating}
      sportLabel={sportLabel}
    />
  );
}