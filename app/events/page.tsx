import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventsFilter from "./components/EventsFilter";
import { allSports } from "@/lib/sportsData";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const metadata: Metadata = {
  title: "Veranstaltungen - WNS Community",
  description: "Entdecke und nimm teil an Veranstaltungen für deine Lieblingssportarten",
};

// Update the Event type to match what's returned from Prisma
type Event = {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizerId: string;
  groupId: string | null;
  locationId: string | null;
  group?: {
    id: string;
    name: string;
    sport: string;
    isPrivate: boolean;
  } | null;
  location?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  _count?: {
    attendees: number;
  };
  accessible?: boolean;
};

type SportFilter = {
  sport: string;
  _count: {
    id: number;
  };
};

// Define a type for the date filter
type DateFilter = {
  startTime?: {
    gt?: Date;
    gte?: Date;
    lt?: Date;
    lte?: Date;
  };
};

// Define a type for the raw query result
type SportCountResult = {
  sport: string;
  count: string | number;
};

// Helper function to get a human-readable description of the timeframe
function timeframeDisplay(timeframe?: string): string {
  if (!timeframe) return "Alle Veranstaltungen";
  const timeframeMap: Record<string, string> = {
    today: "Heute",
    tomorrow: "Morgen",
    thisWeek: "Diese Woche",
    thisMonth: "Diesen Monat",
    future: "Zukünftige Veranstaltungen"
  };
  return timeframeMap[timeframe] || "Veranstaltungen";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { sport?: string; sports?: string; timeframe?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // Get unique sports for filters
  // We'll only count sports from public groups and private groups the user is a member of
  let sportCounts: SportCountResult[] = [];
  
  if (userId) {
    try {
      // Fetch all events with their group information
      const events = await prisma.event.findMany({
        where: {
          group: {
            OR: [
              { isPrivate: false },
              { ownerId: userId },
              { members: { some: { id: userId } } }
            ]
          }
        },
        include: {
          group: {
            select: {
              sport: true
            }
          }
        }
      });
      
      // Count events by sport
      const sportMap = new Map<string, number>();
      events.forEach(event => {
        if (event.group?.sport) {
          const sport = event.group.sport;
          sportMap.set(sport, (sportMap.get(sport) || 0) + 1);
        }
      });
      
      // Convert to array of objects
      sportCounts = Array.from(sportMap.entries())
        .map(([sport, count]) => ({
          sport,
          count
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error fetching sport counts:", error);
      sportCounts = [];
    }
  }

  // Calculate date filter based on timeframe
  const now = new Date();
  let dateFilter: DateFilter = {};
  
  switch (searchParams.timeframe) {
    case 'today':
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      dateFilter = {
        startTime: {
          gte: todayStart,
          lte: todayEnd
        }
      };
      break;
    case 'tomorrow':
      const tomorrowStart = addDays(new Date(), 1);
      tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = addDays(new Date(), 1);
      tomorrowEnd.setHours(23, 59, 59, 999);
      dateFilter = {
        startTime: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        }
      };
      break;
    case 'thisWeek':
      dateFilter = {
        startTime: {
          gte: startOfWeek(now, { weekStartsOn: 1 }),
          lte: endOfWeek(now, { weekStartsOn: 1 })
        }
      };
      break;
    case 'thisMonth':
      dateFilter = {
        startTime: {
          gte: startOfMonth(now),
          lte: endOfMonth(now)
        }
      };
      break;
    case 'future':
      dateFilter = {
        startTime: {
          gte: now
        }
      };
      break;
    default:
      // By default, show future events
      dateFilter = {
        startTime: {
          gte: now
        }
      };
  }

  // Build where clause based on search parameters
  let where: any = {
    ...dateFilter
  };
  
  // Handle single sport filter parameter (backward compatibility)
  if (searchParams.sport) {
    where.group = {
      ...where.group,
      sport: searchParams.sport
    };
  }
  
  // Handle multiple sports filter parameter
  if (searchParams.sports) {
    const selectedSports = searchParams.sports.split(',');
    where.group = {
      ...where.group,
      sport: { in: selectedSports }
    };
  }
  
  // Add private group filter to show only accessible events
  where.OR = [
    { group: { isPrivate: false } }, // Public group events are always accessible
    { group: null },                 // Events without a group are always accessible
  ];
  
  // If user is logged in, also include events from private groups they're a member of
  if (userId) {
    where.OR.push(
      { 
        group: { 
          isPrivate: true,
          OR: [
            { ownerId: userId },                // User is the group owner
            { members: { some: { id: userId } } } // User is a group member
          ]
        } 
      }
    );
  }
  
  // Get all events with filtering
  const events = await prisma.event.findMany({
    where,
    include: {
      group: {
        select: {
          id: true,
          name: true,
          sport: true,
          isPrivate: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      _count: {
        select: {
          attendees: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Prepare sports data for the filter component
  const sportsWithCounts = sportCounts.map(item => ({
    value: item.sport,
    label: allSports.find(s => s.value === item.sport)?.label || item.sport,
    count: Number(item.count)
  }));

  // Prepare variables for component rendering
  const selectedSportsArray = searchParams.sports?.split(',') || [];
  const currentSportValue = searchParams.sport || "";
  const currentTimeframe = searchParams.timeframe || "future";

  // Get filter description for display
  const filterDescription = timeframeDisplay(currentTimeframe);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-6">
          <EventsFilter 
            sports={sportsWithCounts}
            selectedSports={selectedSportsArray}
            currentSport={currentSportValue}
            currentTimeframe={currentTimeframe}
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {searchParams.sport 
                ? `${searchParams.sport} Veranstaltungen` 
                : searchParams.sports 
                  ? "Gefilterte Veranstaltungen" 
                  : filterDescription
              }
            </h1>
            
            <Button asChild>
              <Link href="/events/create">
                Veranstaltung erstellen
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <Tabs defaultValue={currentTimeframe}>
              <TabsList className="mb-4">
                <TabsTrigger value="future" asChild>
                  <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'future' })}`}>Zukünftige</Link>
                </TabsTrigger>
                <TabsTrigger value="today" asChild>
                  <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'today' })}`}>Heute</Link>
                </TabsTrigger>
                <TabsTrigger value="tomorrow" asChild>
                  <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'tomorrow' })}`}>Morgen</Link>
                </TabsTrigger>
                <TabsTrigger value="thisWeek" asChild>
                  <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'thisWeek' })}`}>Diese Woche</Link>
                </TabsTrigger>
                <TabsTrigger value="thisMonth" asChild>
                  <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'thisMonth' })}`}>Dieser Monat</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Veranstaltungen gefunden</h3>
              <p className="text-gray-500 mb-6">
                {searchParams.sport
                  ? `Es gibt keine ${searchParams.sport} Veranstaltungen für diesen Zeitraum.`
                  : searchParams.sports
                    ? "Es gibt keine Veranstaltungen für die ausgewählten Sportarten in diesem Zeitraum."
                    : "Es gibt keine Veranstaltungen für diesen Zeitraum."}
              </p>
              <Button asChild>
                <Link href="/events/create">Erste Veranstaltung erstellen</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: Event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="h-40 bg-gray-200 relative">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <span className="text-2xl font-bold">{event.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-white dark:bg-black bg-opacity-80 dark:bg-opacity-80 p-2 text-sm">
                      {format(new Date(event.startTime), "dd.MM.yyyy • HH:mm")}
                    </div>
                  </div>
                  <CardHeader className="flex-grow">
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <CardDescription>
                      {event.group ? (
                        <span>
                          {event.group.name} {event.group.isPrivate && " (Private Gruppe)"}
                        </span>
                      ) : (
                        "Keine Gruppe"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow-0">
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {event.description || "Keine Beschreibung vorhanden."}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/events/${event.id}`}>
                        Details ansehen
                      </Link>
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