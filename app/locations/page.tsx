import { Metadata } from "next";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LocationsFilter from "./components/LocationsFilter";
import { allSports } from "@/lib/sportsData";

export const metadata: Metadata = {
  title: "Orte - WNS Community",
  description: "Entdecke und teile Orte für deine Lieblingssportarten",
};

type Location = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  sport: string;
  sports?: string[];
  latitude: number;
  longitude: number;
  address: string | null;
  images: string[];
  rating: number | null;
  createdAt: Date;
  _count: {
    reviews: number;
  };
};

type SportFilter = {
  sport: string;
  _count: {
    id: number;
  };
};

type TypeFilter = {
  type: string;
  _count: {
    id: number;
  };
};

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { sport?: string; sports?: string; type?: string };
}) {
  const prisma = new PrismaClient();
  
  // Get unique sports and types for filters
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

  const types = await prisma.location.groupBy({
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

  // Build where clause based on search parameters
  let where: any = {};
  
  // Handle single sport filter parameter (backward compatibility)
  if (searchParams.sport) {
    where.sport = searchParams.sport;
  }
  
  // Handle multiple sports filter parameter
  if (searchParams.sports) {
    const selectedSports = searchParams.sports.split(',');
    where.OR = [
      { sport: { in: selectedSports } }
    ];
  }
  
  // Handle type filter
  if (searchParams.type) {
    where.type = searchParams.type;
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

  // Prepare sports data for the filter component
  const sportsWithCounts = sportCounts.map((sportCount) => ({
    value: sportCount.sport,
    label: allSports.find(s => s.value === sportCount.sport)?.label || sportCount.sport,
    count: sportCount._count.id,
  }));

  // Prepare types data for the filter component
  const typesWithCounts = types.map((type) => ({
    value: type.type,
    count: type._count.id,
  }));

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar with Filters */}
        <div className="w-full md:w-64">
          <LocationsFilter 
            sports={sportsWithCounts} 
            types={typesWithCounts}
            selectedSports={searchParams.sports?.split(',') || []} 
            selectedType={searchParams.type || ''}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {searchParams.type 
                ? `${searchParams.type} Orte` 
                : searchParams.sport
                  ? `${searchParams.sport} Orte`
                  : searchParams.sports
                    ? "Gefilterte Orte"
                    : "Alle Orte"
              }
            </h1>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Orte gefunden</h3>
              <p className="text-gray-500 mb-6">
                {searchParams.type || searchParams.sport || searchParams.sports
                  ? "Es wurden keine Orte gefunden, die den ausgewählten Filtern entsprechen."
                  : "Es wurden noch keine Orte hinzugefügt."}
              </p>
              <Button asChild>
                <Link href="/locations/create">Ersten Ort hinzufügen</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location: Location) => (
                <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 relative">
                    {location.images && location.images.length > 0 ? (
                      <img
                        src={location.images[0]}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <span className="text-2xl font-bold">{location.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="truncate">{location.name}</CardTitle>
                    <CardDescription>
                      {location.type} • {location.sport}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-2">
                      {location.description || "Keine Beschreibung vorhanden."}
                    </p>
                    {location.address && (
                      <p className="text-gray-500 text-sm mt-2 truncate">
                        📍 {location.address}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/locations/${location.id}`}>Details ansehen</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 