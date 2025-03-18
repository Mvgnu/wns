import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { allSports } from "@/lib/sportsData";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsFilter from "@/app/groups/components/GroupsFilter";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Gruppen - WNS Community",
  description: "Entdecke und tritt Gruppen von Hobbysport-Enthusiasten bei",
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  sports?: string[];
  location: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  _count: {
    members: number;
  };
};

type SportGroup = {
  sport: string;
  _count: {
    id: number;
  };
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Get user session to check membership status
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // Build where clause based on search parameters
  let where: Prisma.GroupWhereInput = {};

  // For private groups, only show if:
  // 1. The group is not private, OR
  // 2. The user is the owner/member of the private group
  if (userId) {
    // If user is logged in, show all public groups and private groups they're a member of
    where = {
      OR: [
        { isPrivate: false },
        {
          isPrivate: true,
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } }
          ]
        }
      ]
    };
  } else {
    // If user is not logged in, only show public groups
    where.isPrivate = false;
  }
  
  // Handle sport filter parameter
  const sportParam = searchParams.sport as string | undefined;
  if (sportParam) {
    where = {
      AND: [
        where,
        { sport: sportParam }
      ]
    };
  }
  
  // Handle multiple sports filter parameter
  const sportsParam = searchParams.sports as string | undefined;
  if (sportsParam) {
    const selectedSports = sportsParam.split(',');
    
    where = {
      AND: [
        where,
        { sport: { in: selectedSports } }
      ]
    };
  }
  
  // Get all sports for filter (only from public groups or groups user is a member of)
  const sportCounts = await prisma.group.groupBy({
    by: ["sport"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    where: userId ? {
      OR: [
        { isPrivate: false },
        {
          isPrivate: true,
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } }
          ]
        }
      ]
    } : { isPrivate: false }
  });
  
  // Get all groups with filtering
  const groups = await prisma.group.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      sport: true,
      location: true,
      locationName: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      isPrivate: true,
      ownerId: true,
      _count: {
        select: {
          members: true,
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
    count: sportCount._count?.id || 0,
  }));

  // Prepare variables for component rendering
  const selectedSportsArray = sportsParam?.split(',') || [];
  const currentSportValue = sportParam || "";

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar with Filter */}
        <div className="w-full md:w-64 space-y-6">
          <GroupsFilter 
            sports={sportsWithCounts} 
            selectedSports={selectedSportsArray} 
            currentSport={currentSportValue}
          />
          
          <div>
            <Button className="w-full" asChild>
              <Link href="/groups/create">Neue Gruppe erstellen</Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {sportParam 
                ? `${sportParam} Gruppen` 
                : sportsParam 
                  ? "Gefilterte Gruppen" 
                  : "Alle Gruppen"
              }
            </h1>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Gruppen gefunden</h3>
              <p className="text-gray-500 mb-6">
                {sportParam
                  ? `Es gibt noch keine Gruppen für ${sportParam}.`
                  : sportsParam
                    ? "Es gibt keine Gruppen, die den ausgewählten Filtern entsprechen."
                    : "Es gibt noch keine Gruppen."}
              </p>
              <Button asChild>
                <Link href="/groups/create">Erste Gruppe erstellen</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: Group) => (
                <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-gray-200 relative">
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <span className="text-2xl font-bold">{group.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {group.sport} • {group._count.members} {group._count.members === 1 ? "Mitglied" : "Mitglieder"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-2">
                      {group.description || "Keine Beschreibung vorhanden."}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/groups/${group.id}`}>Gruppe ansehen</Link>
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