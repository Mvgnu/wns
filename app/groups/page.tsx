import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { allSports } from "@/lib/sportsData";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsFilter from "@/app/groups/components/GroupsFilter";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import GroupsClientWrapper from './components/GroupsClientWrapper';

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

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const searchQuery = searchParams.search as string | undefined;
  const sportQuery = searchParams.sport as string | undefined;
  const sportsQuery = searchParams.sports as string | undefined;
  const selectedSports = sportsQuery ? sportsQuery.split(',') : [];

  // Build the where clause for the Prisma query
  let where: Prisma.GroupWhereInput = {};

  // Search functionality
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { locationName: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Filter by sport, either a single sport or multiple sports
  if (sportQuery) {
    where.sport = sportQuery;
  } else if (selectedSports.length > 0) {
    where.sport = { in: selectedSports };
  }

  // Add logic for public groups or groups the user is a member of
  const userId = session?.user?.id;
  if (userId) {
    // User is logged in, they can see public groups and groups they are members of
    where = {
      ...where,
      OR: [
        { isPrivate: false },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    };
  } else {
    // Only public groups for not logged-in users
    where.isPrivate = false;
  }

  // Fetch groups with counts
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

  // Get sport counts for all groups (for filtering)
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

  // Get total group count
  const totalGroupCount = await prisma.group.count({
    where: userId
      ? {
          OR: [
            { isPrivate: false },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        }
      : { isPrivate: false },
  });

  // Prepare sports data for the filter component
  const sportsWithCounts = sportCounts.map((sportCount) => ({
    value: sportCount.sport,
    label: allSports.find(s => s.value === sportCount.sport)?.label || sportCount.sport,
    count: sportCount._count?.id || 0,
  }));

  // Prepare variables for component rendering
  const currentSportValue = sportQuery || "";

  return (
    <GroupsClientWrapper
      groups={groups}
      sportCounts={sportCounts}
      selectedSports={selectedSports}
      currentSport={currentSportValue}
      allSports={allSports}
      totalGroupCount={totalGroupCount}
      userId={userId}
    />
  );
} 