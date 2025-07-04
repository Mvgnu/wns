import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { allSports } from "@/lib/sportsData";
import LocationsClientWrapper from "./components/LocationsClientWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sport Locations | WNS Community",
  description: "Entdecke und teile die besten Orte für deine Sportaktivitäten – von Fußballplätzen über Kletterhallen bis hin zu Laufstrecken.",
};

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const searchQuery = searchParams.search as string | undefined;
  const sportQuery = searchParams.sport as string | undefined;
  const sportsQuery = searchParams.sports as string | undefined;
  const typeQuery = searchParams.type as string | undefined;
  const detailTypeQuery = searchParams.detailType as string | undefined;
  const amenitiesQuery = searchParams.amenities as string | undefined;
  const selectedSports = sportsQuery ? sportsQuery.split(',') : [];
  const selectedAmenities = amenitiesQuery ? amenitiesQuery.split(',') : [];
  
  // Build where clause for the Prisma query
  let where: any = {};
  
  // Search functionality
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { address: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  
  // Filter by sport, either a single sport or multiple sports
  if (sportQuery) {
    where.sport = sportQuery;
  } else if (selectedSports.length > 0) {
    where.sports = {
      hasSome: selectedSports
    };
  }
  
  // Filter by type
  if (typeQuery) {
    where.placeType = typeQuery;
  }

  // Filter by detail type
  if (detailTypeQuery) {
    where.detailType = detailTypeQuery;
  }

  // Filter by amenities
  if (selectedAmenities.length > 0) {
    where.amenities = {
      some: {
        type: {
          in: selectedAmenities
        }
      }
    };
  }
  
  // Get locations with filtering
  const locations = await prisma.location.findMany({
    where,
    include: {
      _count: {
        select: {
          reviews: true,
          events: true,
        },
      },
      amenities: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      staff: true,
      claims: {
        where: {
          status: 'APPROVED'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  // Get sport counts for all locations
  const sportCounts = await prisma.location.groupBy({
    by: ["sport"],
    _count: {
      id: true,
    },
  });
  
  // Get type counts for all locations
  const typeCounts = await prisma.location.groupBy({
    by: ["placeType"],
    _count: {
      id: true,
    },
  });

  // Get detail type counts
  const detailTypeCounts = await prisma.location.groupBy({
    by: ["detailType"],
    _count: {
      id: true,
    },
  });

  // Get amenity counts
  const amenityCountsRaw = await prisma.$queryRaw`
    SELECT "type", COUNT(id) as count 
    FROM "PlaceAmenity" 
    GROUP BY "type" 
    ORDER BY count DESC
  `;
  
  // Transform to match interface
  const amenityCounts = (amenityCountsRaw as any[]).map(item => ({
    type: item.type,
    _count: {
      id: Number(item.count)
    }
  }));
  
  // Get total location count
  const totalLocationsCount = await prisma.location.count();

  // Calculate average ratings and transform locations
  const locationsWithRatings = locations.map(location => {
    const avgRating = location.reviews.length > 0
      ? location.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / location.reviews.length
      : null;
    
    // Transform the location to match the LocationsClientWrapper interface
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      placeType: location.placeType,
      detailType: location.detailType,
      sport: location.sport,
      sports: location.sports,
      address: location.address,
      city: null,
      state: null,
      country: null,
      latitude: location.latitude,
      longitude: location.longitude,
      image: location.images[0] || null,
      amenities: location.amenities,
      _count: location._count,
      averageRating: avgRating,
      staff: location.staff,
      claims: location.claims,
    };
  });

  return (
    <LocationsClientWrapper
      locations={locationsWithRatings}
      sportCounts={sportCounts}
      typeCounts={typeCounts}
      detailTypeCounts={detailTypeCounts}
      amenityCounts={amenityCounts}
      selectedSports={selectedSports}
      selectedType={typeQuery || ''}
      selectedDetailType={detailTypeQuery || ''}
      selectedAmenities={selectedAmenities}
      allSports={allSports}
      totalLocationsCount={totalLocationsCount}
      userId={session?.user?.id}
    />
  );
} 