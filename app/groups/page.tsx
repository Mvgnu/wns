import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { allSports } from "@/lib/sportsData";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import GroupsFilter from "@/app/groups/components/GroupsFilter";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import GroupsClientWrapper from './components/GroupsClientWrapper';
import { checkPrismaConnection } from "@/lib/prisma";
import { getSafeServerSession } from "@/lib/sessionHelper";

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
  city?: string | null;
  state?: string | null;
  country?: string | null;
  activityLevel?: string | null;
  groupTags?: string[];
  status?: string;
  entryRules?: any;
  settings?: any;
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
  try {
    // Check database connection first
    const isConnected = await checkPrismaConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    const session = await getSafeServerSession();
    const searchQuery = searchParams.search as string | undefined;
    const sportQuery = searchParams.sport as string | undefined;
    const sportsQuery = searchParams.sports as string | undefined;
    const selectedSports = sportsQuery ? sportsQuery.split(',') : [];
    const groupTypeQuery = searchParams.type as string | undefined;

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
                id: userId,
              },
            },
          },
        ],
      };
    } else {
      // Only public groups for not logged-in users
      where.isPrivate = false;
    }

    // Status filter - only show active groups by default
    where.status = {
      equals: 'active'
    };

    // Fetch groups with counts and enhanced information
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
        city: true,
        state: true,
        country: true,
        activityLevel: true,
        groupTags: true,
        status: true,
        entryRules: true,
        settings: true,
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

    // Separate groups into sports clubs and user groups
    // We'll consider a group a "sports club" if it has high activity level, structured entry rules, or specific tags
    const sportsClubs = groups.filter(group => {
      // Parse the entryRules and settings JSON if they exist
      const entryRules = group.entryRules ? 
        (typeof group.entryRules === 'string' ? JSON.parse(group.entryRules) : group.entryRules) : null;
      const settings = group.settings ? 
        (typeof group.settings === 'string' ? JSON.parse(group.settings) : group.settings) : null;
      
      // Check if it's a structured club with formal requirements
      const isStructured = entryRules?.requireApproval === true || 
                           settings?.contentModeration === 'high';
      
      // Check for club-like tags
      const hasClubTags = group.groupTags?.some(tag => 
        ['verein', 'club', 'team', 'wettbewerb', 'fortgeschritten'].includes(tag)
      );

      // High activity groups or those with formal structure are considered sports clubs
      return (group.activityLevel === 'high' && isStructured) || hasClubTags;
    });

    const userGroups = groups.filter(group => {
      // If it's not in sportsClubs, it's a user group
      return !sportsClubs.some(club => club.id === group.id);
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
        ],
        status: 'active'
      } : { 
        isPrivate: false,
        status: 'active' 
      }
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
                    id: userId,
                  },
                },
              },
            ],
            status: 'active'
          }
        : { 
            isPrivate: false,
            status: 'active'
          },
    });

    // Prepare sports data for the filter component
    const sportsWithCounts = sportCounts.map((sportCount) => ({
      value: sportCount.sport,
      label: allSports.find(s => s.value === sportCount.sport)?.label || sportCount.sport,
      count: sportCount._count?.id || 0,
    }));

    // Prepare variables for component rendering
    const currentSportValue = sportQuery || "";
    
    // Filter display groups based on the type query parameter
    let displayGroups = groups;
    if (groupTypeQuery === 'clubs') {
      displayGroups = sportsClubs;
    } else if (groupTypeQuery === 'groups') {
      displayGroups = userGroups;
    }

    return (
      <main>
        <GroupsClientWrapper
          groups={displayGroups}
          sportCounts={sportCounts}
          selectedSports={selectedSports}
          currentSport={currentSportValue}
          allSports={allSports}
          totalGroupCount={totalGroupCount}
          userId={userId || undefined}
          sportsClubs={sportsClubs}
          userGroups={userGroups}
          groupType={groupTypeQuery || 'all'}
        />
      </main>
    );
  } catch (error) {
    console.error("Error in GroupsPage:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">
          Oops! Etwas ist schiefgelaufen.
        </h1>
        <p className="mt-2">
          Bitte versuche es später noch einmal oder kontaktiere den Support.
        </p>
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-sm">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
} 