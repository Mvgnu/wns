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

// Dynamic metadata based on search parameters
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const searchQuery = searchParams.search as string | undefined;
  const sportQuery = searchParams.sport as string | undefined;
  const sportsQuery = searchParams.sports as string | undefined;
  const groupTypeQuery = searchParams.type as string | undefined;

  // Check if page has filters (should not be indexed)
  const hasFilters = !!(searchQuery || sportQuery || sportsQuery || groupTypeQuery);

  // Build canonical URL - always point to base groups page
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  const canonicalUrl = `${baseUrl}/groups`;

  // Build description based on filters
  let description = "Entdecke und tritt Gruppen von Hobbysport-Enthusiasten bei";

  if (searchQuery) {
    description = `Suche nach "${searchQuery}" - Entdecke passende Sportgruppen in der WNS Community`;
  } else if (sportQuery) {
    const sportObj = allSports.find(s => s.value === sportQuery);
    const sportLabel = sportObj?.label || sportQuery;
    description = `${sportLabel} Gruppen - Entdecke ${sportLabel} Gruppen und Communities`;
  } else if (sportsQuery) {
    const sportsArray = sportsQuery.split(',');
    const sportLabels = sportsArray.map(sport => {
      const sportObj = allSports.find(s => s.value === sport);
      return sportObj?.label || sport;
    });
    description = `${sportLabels.join(', ')} Gruppen - Entdecke Sportgruppen für ${sportLabels.join(', ')}`;
  } else if (groupTypeQuery === 'clubs') {
    description = "Sportvereine und Clubs - Professionelle und organisierte Sportgruppen";
  } else if (groupTypeQuery === 'groups') {
    description = "Sportgruppen - Informelle und freizeitliche Sport-Communities";
  }

  return {
    title: searchQuery ? `Suche: ${searchQuery} - Gruppen` : "Gruppen - WNS Community",
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: hasFilters ? {
      index: false, // Don't index filtered pages
      follow: true,
    } : {
      index: true,
      follow: true,
    },
    openGraph: {
      title: searchQuery ? `Suche: ${searchQuery} - Gruppen` : "Gruppen - WNS Community",
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: searchQuery ? `Suche: ${searchQuery} - Gruppen` : "Gruppen - WNS Community",
      description,
    },
  };
}

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
  entryRules: any;
  settings: any;
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
    const resolvedSearchParams = await searchParams;
    const searchQuery = resolvedSearchParams.search as string | undefined;
    const sportQuery = resolvedSearchParams.sport as string | undefined;
    const sportsQuery = resolvedSearchParams.sports as string | undefined;
    const selectedSports = sportsQuery ? sportsQuery.split(',') : [];
    const groupTypeQuery = resolvedSearchParams.type as string | undefined;

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
      // Parse JSON settings for structured fields
      const entryRules = group.entryRules as any || {};
      const settings = group.settings as any || {};
      const isStructured = entryRules.requireApproval === true ||
                           settings.contentModeration === 'high';

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