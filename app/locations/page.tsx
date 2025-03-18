import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { allSports } from "@/lib/sportsData";
import LocationsClientWrapper from "./components/LocationsClientWrapper";

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
  const searchQuery = searchParams.search as string | undefined;
  const sportQuery = searchParams.sport as string | undefined;
  const sportsQuery = searchParams.sports as string | undefined;
  const typeQuery = searchParams.type as string | undefined;
  const selectedSports = sportsQuery ? sportsQuery.split(',') : [];
  
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
    where.sport = { in: selectedSports };
  }
  
  // Filter by type
  if (typeQuery) {
    where.type = typeQuery;
  }
  
  // Get locations with filtering
  const locations = await prisma.location.findMany({
    where,
    include: {
      _count: {
        select: {
          reviews: true,
        },
      },
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
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });
  
  // Get type counts for all locations
  const typeCounts = await prisma.location.groupBy({
    by: ["type"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });
  
  // Get total location count
  const totalLocationsCount = await prisma.location.count();

  return (
    <LocationsClientWrapper
      locations={locations}
      sportCounts={sportCounts}
      typeCounts={typeCounts}
      selectedSports={selectedSports}
      selectedType={typeQuery || ''}
      allSports={allSports}
      totalLocationsCount={totalLocationsCount}
    />
  );
} 