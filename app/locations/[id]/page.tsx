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

// Helper function to get sport label from sport code
function getSportLabel(sportCode: string): string {
  const sportObj = allSports.find(s => s.value === sportCode);
  return sportObj?.label || sportCode;
}

export default async function LocationPage({ params }: LocationPageProps) {
  let location = null;
  let averageRating = 0;
  const id = params.id;
  
  // Get current user session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // Initialize values for new props
  let userIsStaff = false;
  let existingClaim = null;
  
  try {
    // Fetch location data
    location = await prisma.location.findUnique({
      where: { id },
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
        // Include amenities
        amenities: {
          orderBy: {
            type: 'asc',
          },
        },
        // Include videos
        videos: {
          include: {
            uploadedBy: {
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
        // Include pricing
        prices: {
          orderBy: {
            amount: 'asc',
          },
        },
        // Include staff
        staff: {
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
            role: 'asc',
          },
        },
      },
    });

    if (!location) {
      return notFound();
    }

    // Calculate average rating
    if (location.reviews.length > 0) {
      const totalRating = location.reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / location.reviews.length;
    }
    
    // Check if user is a staff member for this place
    if (userId) {
      // Use raw database query or handle the client differently
      const staffRecords = await prisma.$queryRaw`
        SELECT id FROM "PlaceStaff" WHERE "locationId" = ${id} AND "userId" = ${userId} LIMIT 1
      `;
      
      userIsStaff = Array.isArray(staffRecords) && staffRecords.length > 0;
      
      // Check for existing claim if not staff
      if (!userIsStaff) {
        const claims = await prisma.$queryRaw`
          SELECT id, status FROM "PlaceClaim" 
          WHERE "locationId" = ${id} AND "userId" = ${userId}
          ORDER BY "createdAt" DESC LIMIT 1
        `;
        
        existingClaim = Array.isArray(claims) && claims.length > 0 ? claims[0] : null;
      }
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return notFound();
  }

  // Get the sport label based on the main sport
  const sportLabel = getSportLabel(location.sport);

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
      userIsStaff={userIsStaff}
      existingClaim={existingClaim}
    />
  );
}