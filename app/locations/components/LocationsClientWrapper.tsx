"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LocationsFilter from "./LocationsFilter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, MapPin, ChevronRight, PlusCircle, Star, Map, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import LocationCard from '@/components/locations/LocationCard';

// Dynamically import the map component to avoid SSR issues
const LocationsMap = dynamic(() => import('./LocationsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-400" />
    </div>
  ),
});

interface Sport {
  value: string;
  label: string;
  count: number;
}

interface LocationType {
  value: string;
  count: number;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  placeType: string;
  detailType: string;
  sport: string;
  sports: string[];
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  image: string | null;
  amenities: any[];
  _count: {
    reviews: number;
    events: number;
  };
  averageRating: number | null;
  staff: any[];
  claims: Array<{
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
}

interface SportCount {
  sport: string;
  _count: {
    id: number;
  };
}

interface TypeCount {
  placeType: string;
  _count: {
    id: number;
  };
}

interface DetailTypeCount {
  detailType: string;
  _count: {
    id: number;
  };
}

interface AmenityCount {
  type: string;
  _count: {
    id: number;
  };
}

interface LocationsClientWrapperProps {
  locations: Location[];
  sportCounts: SportCount[];
  typeCounts: TypeCount[];
  detailTypeCounts: DetailTypeCount[];
  amenityCounts: AmenityCount[];
  selectedSports: string[];
  selectedType: string;
  selectedDetailType: string;
  selectedAmenities: string[];
  allSports: Array<{ value: string; label: string }>;
  totalLocationsCount: number;
  userId?: string;
}

export default function LocationsClientWrapper({
  locations,
  sportCounts,
  typeCounts,
  detailTypeCounts,
  amenityCounts,
  selectedSports,
  selectedType,
  selectedDetailType,
  selectedAmenities,
  allSports,
  totalLocationsCount,
  userId
}: LocationsClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [view, setView] = useState<'grid' | 'map'>('grid');
  
  const sportParam = searchParams.get("sport");
  const sportsParam = searchParams.get("sports");
  const typeParam = searchParams.get("type");
  const searchParam = searchParams.get("search");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    
    router.push(`/locations?${params.toString()}`);
  };
  
  const removeFilter = (type: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === "search") {
      params.delete("search");
    } else if (type === "sport") {
      params.delete("sport");
    } else if (type === "type") {
      params.delete("type");
    } else if (type === "sports" && value) {
      const currentSports = params.get("sports")?.split(",") || [];
      const newSports = currentSports.filter(s => s !== value);
      
      if (newSports.length > 0) {
        params.set("sports", newSports.join(","));
      } else {
        params.delete("sports");
      }
    }
    
    router.push(`/locations?${params.toString()}`);
  };
  
  const clearAllFilters = () => {
    router.push("/locations");
  };

  // Helper function to render star rating
  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </div>
    );
  };
  
  // Get locations with coordinates for the map
  const locationsWithCoords = locations.filter(
    location => location.latitude && location.longitude
  );

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      <div className="container mx-auto py-10 px-4">
        {/* Hero Section */}
        <div className="relative mb-12 pb-12 border-b border-gray-100">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Entdecke die besten <span className="text-green-600">Sport-Locations</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Finde perfekte Orte für deine Sportaktivitäten – von Fußballplätzen über Kletterhallen bis hin zu Laufstrecken. 
              Teile deine Lieblingsorte und entdecke Geheimtipps von anderen Sportbegeisterten.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Suche nach Locations, Sportarten oder Adressen..."
                    className="pl-10 py-6 text-base w-full bg-white"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
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
                <div className="bg-green-50 rounded-full p-2 mr-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalLocationsCount}+</p>
                  <p className="text-sm text-gray-500">Sport-Locations</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-indigo-50 rounded-full p-2 mr-3">
                  <Map className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{typeCounts.length}+</p>
                  <p className="text-sm text-gray-500">Verschiedene Typen</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-50 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">Community</p>
                  <p className="text-sm text-gray-500">Geteilte Erfahrungen</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Element */}
          <div className="absolute right-0 bottom-0 transform translate-y-1/2 hidden xl:block">
            <div className="w-64 h-64 bg-gradient-to-tr from-green-600 to-blue-500 rounded-full opacity-10"></div>
          </div>
        </div>
      
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with Filter */}
          <div className="w-full md:w-72 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Title for sidebar on mobile */}
              <div className="md:hidden">
                <h2 className="text-lg font-semibold mb-2">Filter</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </div>
            
              {/* Filter component with enhanced styling */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-medium text-gray-900 mb-4">Filter</h3>
                
                {/* Text search within sidebar for mobile */}
                <div className="block md:hidden mb-4">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Suchen..."
                      className="pl-9 py-2 text-sm w-full"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </form>
                </div>
              
                <LocationsFilter
                  sportCounts={sportCounts}
                  typeCounts={typeCounts}
                  detailTypeCounts={detailTypeCounts}
                  amenityCounts={amenityCounts}
                  selectedSports={selectedSports}
                  selectedType={selectedType}
                  selectedDetailType={selectedDetailType}
                  selectedAmenities={selectedAmenities}
                  allSports={allSports}
                />
              </div>
              
              {/* Quick stats card */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-100">
                <h3 className="font-medium text-green-800 mb-3">Beliebte Typen</h3>
                <div className="space-y-2">
                  {typeCounts.slice(0, 3).map(item => (
                    <div key={item.placeType} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{item.placeType}</span>
                      <Badge variant="outline" className="bg-white text-green-600">
                        {item._count.id} Orte
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Create Location CTA */}
              <Button className="w-full gap-2 shadow-sm" asChild>
                <Link href="/locations/create">
                  <PlusCircle className="w-4 h-4" />
                  Neuen Ort hinzufügen
                </Link>
              </Button>
              
              {/* Community Promo */}
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">Teile deine Lieblingsorte</h3>
                <p className="text-white/90 text-sm mb-4">Hilf anderen Sportbegeisterten, die besten Locations für ihre Aktivitäten zu finden.</p>
                <Button variant="outline" className="w-full text-white border-white/30 bg-white/10 hover:bg-white/20" asChild>
                  <Link href="/auth/signup">Jetzt beitragen</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {typeParam 
                    ? `${typeParam} Locations` 
                    : sportParam 
                      ? `${allSports.find(s => s.value === sportParam)?.label || sportParam} Locations` 
                      : sportsParam 
                        ? "Gefilterte Locations" 
                        : searchParam
                          ? `Suchergebnisse für "${searchParam}"`
                          : "Alle Sport-Locations"
                  }
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Active filter display */}
            {(sportsParam || sportParam || typeParam || searchParam) && (
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-green-700 font-medium">Aktive Filter:</span>
                  
                  {searchParam && (
                    <Badge variant="outline" className="bg-white border-green-200 text-green-700 gap-1 hover:bg-green-100">
                      Suche: {searchParam}
                      <button onClick={() => removeFilter("search")} className="pl-1 hover:text-green-900">
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {typeParam && (
                    <Badge variant="outline" className="bg-white border-green-200 text-green-700 gap-1 hover:bg-green-100">
                      Typ: {typeParam}
                      <button onClick={() => removeFilter("type")} className="pl-1 hover:text-green-900">
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {sportParam && (
                    <Badge variant="outline" className="bg-white border-green-200 text-green-700 gap-1 hover:bg-green-100">
                      {allSports.find(s => s.value === sportParam)?.label || sportParam}
                      <button onClick={() => removeFilter("sport")} className="pl-1 hover:text-green-900">
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {sportsParam && sportsParam.split(',').map(sport => (
                    <Badge key={sport} variant="outline" className="bg-white border-green-200 text-green-700 gap-1 hover:bg-green-100">
                      {allSports.find(s => s.value === sport)?.label || sport}
                      <button onClick={() => removeFilter("sports", sport)} className="pl-1 hover:text-green-900">
                        ×
                      </button>
                    </Badge>
                  ))}
                  
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-green-700 hover:underline ml-auto"
                  >
                    Alle Filter zurücksetzen
                  </button>
                </div>
              </div>
            )}

            {/* View toggle */}
            <div className="mb-8">
              <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'map')} className="w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
                  <TabsList className="w-full bg-transparent">
                    <TabsTrigger 
                      value="grid" 
                      className="flex-1 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Listenansicht
                    </TabsTrigger>
                    <TabsTrigger 
                      value="map" 
                      className="flex-1 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Kartenansicht
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="grid" className="mt-0">
                  {locations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-500 mb-6">
                        <MapPin className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Keine Locations gefunden</h3>
                      <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        {searchParam
                          ? `Es wurden keine Locations zu "${searchParam}" gefunden.`
                          : typeParam
                            ? `Es gibt noch keine Locations vom Typ "${typeParam}".`
                            : sportParam
                              ? `Es gibt noch keine Locations für ${allSports.find(s => s.value === sportParam)?.label || sportParam}.`
                              : sportsParam
                                ? "Es gibt keine Locations, die den ausgewählten Filtern entsprechen."
                                : "Es gibt noch keine Locations."}
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button asChild variant="outline" className="px-6">
                          <Link href="/locations">Alle anzeigen</Link>
                        </Button>
                        <Button asChild className="px-6">
                          <Link href="/locations/create">Location hinzufügen</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {locations.map((location: Location) => (
                        <LocationCard
                          key={location.id}
                          id={location.id}
                          name={location.name}
                          description={location.description}
                          type={location.placeType}
                          sport={location.sport}
                          address={location.address}
                          rating={location.averageRating}
                          image={location.image}
                          priceRange={location.priceRange}
                          difficulty={location.difficulty}
                          amenities={location.amenities}
                          _count={location._count}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <LocationsMap 
                      locations={locationsWithCoords}
                      center={
                        locationsWithCoords.length > 0
                          ? [locationsWithCoords[0].latitude!, locationsWithCoords[0].longitude!]
                          : [51.1657, 10.4515] // Germany center
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Inspiration Section */}
            <div className="mt-16 bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Entdecke die perfekten Sport-Locations</h2>
                <p className="text-gray-600 mb-8">
                  Von versteckten Laufstrecken bis zu den besten Sportplätzen – finde Orte, die zu deinen Aktivitäten passen, 
                  und teile deine Erfahrungen mit der Community.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-4">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Locations entdecken</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Finde die besten Orte für deine Sportaktivitäten in deiner Nähe.
                    </p>
                    <Link href="/locations" className="text-green-600 hover:underline text-sm font-medium">
                      Jetzt entdecken →
                    </Link>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location hinzufügen</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Teile deine Lieblingsorte und hilf anderen, sie zu entdecken.
                    </p>
                    <Link href="/locations/create" className="text-blue-600 hover:underline text-sm font-medium">
                      Location hinzufügen →
                    </Link>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 text-purple-600 mb-4">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Erfahrungen teilen</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Bewerte Locations und teile deine Erfahrungen mit der Community.
                    </p>
                    <Link href="/auth/signin" className="text-purple-600 hover:underline text-sm font-medium">
                      Anmelden & Beitragen →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 