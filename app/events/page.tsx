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
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, formatDistanceToNow } from "date-fns";
import { Calendar, Users, MapPin, Search, Plus, PlusCircle, Filter, ChevronRight, Clock } from "lucide-react";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-72 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Title for sidebar on mobile */}
              <div className="md:hidden">
                <h2 className="text-lg font-semibold mb-2">Filter</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>
              
              {/* Filter component with enhanced styling */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <EventsFilter 
                  sports={sportsWithCounts}
                  selectedSports={selectedSportsArray}
                  currentSport={currentSportValue}
                  currentTimeframe={currentTimeframe}
                />
              </div>
              
              {/* Quick stats card (optional) */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-3">Sport Highlights</h3>
                <div className="space-y-2">
                  {sportCounts.slice(0, 3).map(item => (
                    <div key={item.sport} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{allSports.find(s => s.value === item.sport)?.label || item.sport}</span>
                      <Badge variant="outline" className="bg-white text-blue-600">
                        {item.count} Events
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchParams.sport 
                    ? `${allSports.find(s => s.value === searchParams.sport)?.label || searchParams.sport} Veranstaltungen` 
                    : searchParams.sports 
                      ? "Gefilterte Veranstaltungen" 
                      : filterDescription
                  }
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>
              
              <Button className="gap-2 shadow-sm" asChild>
                <Link href="/events/create">
                  <PlusCircle className="w-4 h-4" />
                  Veranstaltung erstellen
                </Link>
              </Button>
            </div>

            <div className="mb-8">
              <Tabs defaultValue={currentTimeframe} className="w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
                  <TabsList className="w-full bg-transparent">
                    <TabsTrigger value="future" asChild className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'future' })}`}>Zukünftige</Link>
                    </TabsTrigger>
                    <TabsTrigger value="today" asChild className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'today' })}`}>Heute</Link>
                    </TabsTrigger>
                    <TabsTrigger value="tomorrow" asChild className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'tomorrow' })}`}>Morgen</Link>
                    </TabsTrigger>
                    <TabsTrigger value="thisWeek" asChild className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'thisWeek' })}`}>Diese Woche</Link>
                    </TabsTrigger>
                    <TabsTrigger value="thisMonth" asChild className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                      <Link href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'timeframe')), timeframe: 'thisMonth' })}`}>Dieser Monat</Link>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-6">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Keine Veranstaltungen gefunden</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchParams.sport
                    ? `Es gibt keine ${allSports.find(s => s.value === searchParams.sport)?.label || searchParams.sport} Veranstaltungen für diesen Zeitraum.`
                    : searchParams.sports
                      ? "Es gibt keine Veranstaltungen für die ausgewählten Sportarten in diesem Zeitraum."
                      : "Es gibt keine Veranstaltungen für diesen Zeitraum."}
                </p>
                <Button asChild className="px-6">
                  <Link href="/events/create">Erste Veranstaltung erstellen</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: Event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col group border-gray-100">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600">
                          <Calendar className="w-12 h-12 opacity-40" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                        <div className="flex flex-wrap gap-2 mb-1">
                          {event.group?.sport && (
                            <Badge className="bg-blue-500/90 hover:bg-blue-600 border-none text-white">
                              {allSports.find(s => s.value === event.group?.sport)?.label || event.group.sport}
                            </Badge>
                          )}
                          {event.group?.isPrivate && (
                            <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              Private Gruppe
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                      </div>
                    </div>
                    
                    <CardContent className="py-4 flex-grow">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        <div>
                          <span className="font-medium">
                            {format(new Date(event.startTime), "EEEE", { locale: de })}
                          </span>
                          <span>, {format(new Date(event.startTime), "dd. MMM • HH:mm", { locale: de })}</span>
                        </div>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="line-clamp-1">{event.location.name}</span>
                        </div>
                      )}
                      
                      {event.group && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="line-clamp-1">{event.group.name}</span>
                        </div>
                      )}
                      
                      {event.description && (
                        <p className="text-gray-600 mt-4 line-clamp-2 text-sm">
                          {event.description}
                        </p>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-0 pb-4">
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300" asChild>
                        <Link href={`/events/${event.id}`} className="flex items-center justify-center">
                          Details ansehen
                          <ChevronRight className="ml-1 w-4 h-4" />
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
    </div>
  );
} 