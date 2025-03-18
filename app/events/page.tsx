import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventsFilter from "./components/EventsFilter";
import { allSports, getSportsByCategory } from "@/lib/sportsData";
import { Input } from "@/components/ui/input";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, formatDistanceToNow } from "date-fns";
import { Calendar, Users, MapPin, Search, Plus, PlusCircle, Filter, ChevronRight, Clock, ChevronDown } from "lucide-react";
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
  searchParams: { sport?: string; sports?: string; timeframe?: string; search?: string };
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
  
  // Add text search filter
  if (searchParams.search) {
    const searchTerm = searchParams.search.trim();
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { group: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { location: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }
  
  // Add private group filter to show only accessible events
  where.OR = [
    ...(where.OR || []),
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
  const searchQuery = searchParams.search || "";

  // Get filter description for display
  const filterDescription = timeframeDisplay(currentTimeframe);

  // Prepare sports categories for filter
  const sportsByCategory = getSportsByCategory();
  const sportCategories = Object.keys(sportsByCategory).map(categoryName => ({
    label: categoryName,
    items: sportsByCategory[categoryName].map(sport => ({
      value: sport.value,
      label: sport.label
    }))
  }));

  // Get total event count
  const totalEventCount = await prisma.event.count({
    where: {
      startTime: { gte: new Date() }
    }
  });

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      <div className="container mx-auto py-10 px-4">
        {/* Hero Section */}
        <div className="relative mb-12 pb-12 border-b border-gray-100">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Entdecke Sportveranstaltungen <span className="text-blue-600">in deiner Nähe</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Finde Gleichgesinnte, neue Herausforderungen und aufregende Sporterlebnisse. 
              Egal ob Anfänger oder Profi – hier ist für jeden etwas dabei.
            </p>
            
            {/* Search Bar */}
            <form method="get" className="relative max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    name="search"
                    placeholder="Suche nach Veranstaltungen, Sportarten oder Orten..."
                    className="pl-10 py-6 text-base w-full bg-white"
                    defaultValue={searchParams.search || ''}
                  />
                </div>
                <Button type="submit" size="lg" className="px-6">
                  Suchen
                </Button>
              </div>
            </form>
            
            {/* Stats Section */}
            <div className="flex flex-wrap gap-8 mt-8">
              <div className="flex items-center">
                <div className="bg-blue-50 rounded-full p-2 mr-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalEventCount}+</p>
                  <p className="text-sm text-gray-500">Aktive Veranstaltungen</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-50 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sportCounts.length > 0 ? sportCounts.length : '0'}</p>
                  <p className="text-sm text-gray-500">Sportarten</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-amber-50 rounded-full p-2 mr-3">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">24/7</p>
                  <p className="text-sm text-gray-500">Täglich neue Events</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Image */}
          <div className="absolute right-0 bottom-0 transform translate-y-1/2 hidden xl:block">
            <div className="w-64 h-64 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full opacity-10"></div>
          </div>
        </div>
        
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
                <h3 className="font-medium text-gray-900 mb-4">Filter</h3>
                
                {/* Text search within sidebar for mobile */}
                <div className="block md:hidden mb-4">
                  <form method="get" className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      name="search"
                      placeholder="Suchen..."
                      className="pl-9 py-2 text-sm w-full"
                      defaultValue={searchParams.search || ''}
                    />
                    {/* Preserve existing filters */}
                    {searchParams.sports && <input type="hidden" name="sports" value={searchParams.sports} />}
                    {searchParams.timeframe && <input type="hidden" name="timeframe" value={searchParams.timeframe} />}
                  </form>
                </div>
                
                <EventsFilter 
                  sports={sportsWithCounts}
                  selectedSports={selectedSportsArray}
                  currentSport={currentSportValue}
                  currentTimeframe={currentTimeframe}
                />
                
                {/* Custom Sport Category MultiSelect */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Nach Kategorie filtern</h4>
                  <div className="space-y-2">
                    {sportCategories.map((category: { label: string; items: any[] }) => (
                      <div key={category.label} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-sm mb-2 flex justify-between items-center">
                          <span>{category.label}</span>
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {category.items.slice(0, 6).map((sport: { value: string; label: string }) => {
                            const isSelected = selectedSportsArray.includes(sport.value);
                            
                            // Server-side way to handle URL params
                            const params = new URLSearchParams();
                            
                            // Copy existing search params
                            Object.entries(searchParams || {}).forEach(([key, value]) => {
                              if (value) params.set(key, value.toString());
                            });
                            
                            if (isSelected) {
                              // Remove sport
                              const newSports = (selectedSportsArray || []).filter(s => s !== sport.value);
                              if (newSports.length) {
                                params.set('sports', newSports.join(','));
                              } else {
                                params.delete('sports');
                              }
                            } else {
                              // Add sport
                              const newSports = [...(selectedSportsArray || []), sport.value];
                              params.set('sports', newSports.join(','));
                            }
                            
                            return (
                              <Link
                                key={sport.value}
                                href={`/events?${params.toString()}`}
                                className={`text-xs px-3 py-1.5 rounded-full ${
                                  isSelected 
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {sport.label}
                              </Link>
                            );
                          })}
                          {category.items.length > 6 && (
                            <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                              + {category.items.length - 6} mehr
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick stats card */}
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
              
              {/* Community Promo */}
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">Teil unserer Community werden</h3>
                <p className="text-white/90 text-sm mb-4">Erstelle eigene Veranstaltungen und finde Gleichgesinnte für deine Lieblingssportarten.</p>
                <Button variant="outline" className="w-full text-white border-white/30 bg-white/10 hover:bg-white/20" asChild>
                  <Link href="/auth/signup">Kostenlos registrieren</Link>
                </Button>
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
                      : searchParams.search
                        ? `Suchergebnisse für "${searchParams.search}"`
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
            
            {/* Active filter display */}
            {(searchParams.sports || searchParams.sport || searchParams.search) && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-blue-700 font-medium">Aktive Filter:</span>
                  
                  {searchParams.search && (
                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 gap-1 hover:bg-blue-100">
                      Suche: {searchParams.search}
                      <Link href={`/events?${new URLSearchParams(Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'search')))}`}>
                        <span className="pl-1 hover:text-blue-900">×</span>
                      </Link>
                    </Badge>
                  )}
                  
                  {searchParams.sport && (
                    <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 gap-1 hover:bg-blue-100">
                      {allSports.find(s => s.value === searchParams.sport)?.label || searchParams.sport}
                      <Link href={`/events?${new URLSearchParams(Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'sport')))}`}>
                        <span className="pl-1 hover:text-blue-900">×</span>
                      </Link>
                    </Badge>
                  )}
                  
                  {searchParams.sports && searchParams.sports.split(',').map(sport => (
                    <Badge key={sport} variant="outline" className="bg-white border-blue-200 text-blue-700 gap-1 hover:bg-blue-100">
                      {allSports.find(s => s.value === sport)?.label || sport}
                      <Link href={`/events?${new URLSearchParams({ 
                        ...Object.fromEntries(Object.entries(searchParams).filter(([key]) => key !== 'sports')),
                        ...(searchParams.sports?.split(',').filter(s => s !== sport).length > 0 
                          ? { sports: searchParams.sports.split(',').filter(s => s !== sport).join(',') } 
                          : {})
                      })}`}>
                        <span className="pl-1 hover:text-blue-900">×</span>
                      </Link>
                    </Badge>
                  ))}
                  
                  <Link 
                    href="/events"
                    className="text-xs text-blue-700 hover:underline ml-auto"
                  >
                    Alle Filter zurücksetzen
                  </Link>
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-6">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Keine Veranstaltungen gefunden</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchParams.search 
                    ? `Es wurden keine Veranstaltungen zu "${searchParams.search}" gefunden.`
                    : searchParams.sport
                      ? `Es gibt keine ${allSports.find(s => s.value === searchParams.sport)?.label || searchParams.sport} Veranstaltungen für diesen Zeitraum.`
                      : searchParams.sports
                        ? "Es gibt keine Veranstaltungen für die ausgewählten Sportarten in diesem Zeitraum."
                        : "Es gibt keine Veranstaltungen für diesen Zeitraum."}
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild variant="outline" className="px-6">
                    <Link href="/events">Alle anzeigen</Link>
                  </Button>
                  <Button asChild className="px-6">
                    <Link href="/events/create">Veranstaltung erstellen</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                
                {/* Footer Promotions Section */}
                <div className="mt-16 bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 shadow-sm border border-gray-100">
                  <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sportlich aktiv werden in der Community</h2>
                    <p className="text-gray-600 mb-8">
                      Organisiere eigene Veranstaltungen, finde Gleichgesinnte und teile deine Erfahrungen. 
                      Werde Teil der wachsenden sportlichen Community in deiner Nähe.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Veranstaltungen erstellen</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Bringe Menschen mit deinen eigenen Sportveranstaltungen zusammen.
                        </p>
                        <Link href="/events/create" className="text-indigo-600 hover:underline text-sm font-medium">
                          Jetzt starten →
                        </Link>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                          <Users className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Gruppen beitreten</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Finde und trete Sportgruppen bei, die zu deinen Interessen passen.
                        </p>
                        <Link href="/groups" className="text-blue-600 hover:underline text-sm font-medium">
                          Gruppen entdecken →
                        </Link>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-4">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Locations entdecken</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Entdecke neue Sportstätten und Veranstaltungsorte in deiner Umgebung.
                        </p>
                        <Link href="/locations" className="text-green-600 hover:underline text-sm font-medium">
                          Orte ansehen →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 