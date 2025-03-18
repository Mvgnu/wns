"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GroupsFilter from "./GroupsFilter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, MapPin, ChevronRight, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Sport {
  value: string;
  label: string;
  count: number;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  locationName: string | null;
  isPrivate: boolean;
  _count: {
    members: number;
  };
}

interface GroupsClientWrapperProps {
  groups: Group[];
  sportCounts: any[];
  selectedSports: string[];
  currentSport: string;
  allSports: any[];
  totalGroupCount: number;
  userId?: string;
}

export default function GroupsClientWrapper({
  groups,
  sportCounts,
  selectedSports,
  currentSport,
  allSports,
  totalGroupCount,
  userId
}: GroupsClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  
  const sportParam = searchParams.get("sport");
  const sportsParam = searchParams.get("sports");
  const searchParam = searchParams.get("search");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    
    router.push(`/groups?${params.toString()}`);
  };
  
  const removeFilter = (type: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === "search") {
      params.delete("search");
    } else if (type === "sport") {
      params.delete("sport");
    } else if (type === "sports" && value) {
      const currentSports = params.get("sports")?.split(",") || [];
      const newSports = currentSports.filter(s => s !== value);
      
      if (newSports.length > 0) {
        params.set("sports", newSports.join(","));
      } else {
        params.delete("sports");
      }
    }
    
    router.push(`/groups?${params.toString()}`);
  };
  
  const clearAllFilters = () => {
    router.push("/groups");
  };
  
  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full opacity-30 -z-10 blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full opacity-30 -z-10 blur-2xl transform -translate-x-1/2"></div>
      
      <div className="container mx-auto py-10 px-4">
        {/* Hero Section */}
        <div className="relative mb-12 pb-12 border-b border-gray-100">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Finde deine <span className="text-indigo-600">Sport-Community</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Tritt Gruppen von Gleichgesinnten bei, teile deine Leidenschaft und entdecke neue Sportarten.
              Von Anfängern bis zu Profis – hier findest du die richtige Gemeinschaft für dich.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Suche nach Gruppen, Sportarten oder Orten..."
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
                <div className="bg-indigo-50 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalGroupCount}+</p>
                  <p className="text-sm text-gray-500">Aktive Gruppen</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-50 rounded-full p-2 mr-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sportCounts.length}+</p>
                  <p className="text-sm text-gray-500">Sportarten</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-50 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">Community</p>
                  <p className="text-sm text-gray-500">Gemeinsam aktiv</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Element */}
          <div className="absolute right-0 bottom-0 transform translate-y-1/2 hidden xl:block">
            <div className="w-64 h-64 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-full opacity-10"></div>
          </div>
        </div>
      
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with Filter */}
          <div className="w-full md:w-72 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Title for sidebar on mobile */}
              <div className="md:hidden">
                <h2 className="text-lg font-semibold mb-2">Filter</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
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
              
                <GroupsFilter 
                  sports={sportCounts.map((item) => ({
                    value: item.sport,
                    label: allSports.find(s => s.value === item.sport)?.label || item.sport,
                    count: item._count?.id || 0,
                  }))} 
                  selectedSports={selectedSports} 
                  currentSport={currentSport}
                />
              </div>
              
              {/* Quick stats card */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
                <h3 className="font-medium text-indigo-800 mb-3">Sport Highlights</h3>
                <div className="space-y-2">
                  {sportCounts.slice(0, 3).map(item => (
                    <div key={item.sport} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{allSports.find(s => s.value === item.sport)?.label || item.sport}</span>
                      <Badge variant="outline" className="bg-white text-indigo-600">
                        {item._count.id} Gruppen
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Create Group CTA */}
              <Button className="w-full gap-2 shadow-sm" asChild>
                <Link href="/groups/create">
                  <PlusCircle className="w-4 h-4" />
                  Neue Gruppe erstellen
                </Link>
              </Button>
              
              {/* Community Promo */}
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">Teil unserer Community werden</h3>
                <p className="text-white/90 text-sm mb-4">Erstelle eigene Gruppen und finde Gleichgesinnte für deine Lieblingssportarten.</p>
                <Button variant="outline" className="w-full text-white border-white/30 bg-white/10 hover:bg-white/20" asChild>
                  <Link href="/auth/signup">Kostenlos registrieren</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {sportParam 
                    ? `${allSports.find(s => s.value === sportParam)?.label || sportParam} Gruppen` 
                    : sportsParam 
                      ? "Gefilterte Gruppen" 
                      : searchParam
                        ? `Suchergebnisse für "${searchParam}"`
                        : "Alle Gruppen"
                  }
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Active filter display */}
            {(sportsParam || sportParam || searchParam) && (
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-indigo-700 font-medium">Aktive Filter:</span>
                  
                  {searchParam && (
                    <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700 gap-1 hover:bg-indigo-100">
                      Suche: {searchParam}
                      <button onClick={() => removeFilter("search")} className="pl-1 hover:text-indigo-900">
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {sportParam && (
                    <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700 gap-1 hover:bg-indigo-100">
                      {allSports.find(s => s.value === sportParam)?.label || sportParam}
                      <button onClick={() => removeFilter("sport")} className="pl-1 hover:text-indigo-900">
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {sportsParam && sportsParam.split(',').map(sport => (
                    <Badge key={sport} variant="outline" className="bg-white border-indigo-200 text-indigo-700 gap-1 hover:bg-indigo-100">
                      {allSports.find(s => s.value === sport)?.label || sport}
                      <button onClick={() => removeFilter("sports", sport)} className="pl-1 hover:text-indigo-900">
                        ×
                      </button>
                    </Badge>
                  ))}
                  
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-indigo-700 hover:underline ml-auto"
                  >
                    Alle Filter zurücksetzen
                  </button>
                </div>
              </div>
            )}

            {groups.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Keine Gruppen gefunden</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchParam
                    ? `Es wurden keine Gruppen zu "${searchParam}" gefunden.`
                    : sportParam
                      ? `Es gibt noch keine Gruppen für ${allSports.find(s => s.value === sportParam)?.label || sportParam}.`
                      : sportsParam
                        ? "Es gibt keine Gruppen, die den ausgewählten Filtern entsprechen."
                        : "Es gibt noch keine Gruppen."}
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild variant="outline" className="px-6">
                    <Link href="/groups">Alle anzeigen</Link>
                  </Button>
                  <Button asChild className="px-6">
                    <Link href="/groups/create">Gruppe erstellen</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group: Group) => (
                    <Card key={group.id} className="overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col group border-gray-100">
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {group.image ? (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600">
                            <span className="text-4xl font-bold opacity-40">{group.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                          <div className="flex flex-wrap gap-2 mb-1">
                            <Badge className="bg-indigo-500/90 hover:bg-indigo-600 border-none text-white">
                              {allSports.find(s => s.value === group.sport)?.label || group.sport}
                            </Badge>
                            {group.isPrivate && (
                              <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                                Private Gruppe
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold line-clamp-1">{group.name}</h3>
                        </div>
                      </div>
                      
                      <CardContent className="py-4 flex-grow">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Users className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>
                            {group._count.members} {group._count.members === 1 ? "Mitglied" : "Mitglieder"}
                          </span>
                        </div>
                        
                        {group.locationName && (
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                            <span className="line-clamp-1">{group.locationName}</span>
                          </div>
                        )}
                        
                        {group.description && (
                          <p className="text-gray-600 mt-4 line-clamp-2 text-sm">
                            {group.description}
                          </p>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0 pb-4">
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300" asChild>
                          <Link href={`/groups/${group.id}`} className="flex items-center justify-center">
                            Gruppe ansehen
                            <ChevronRight className="ml-1 w-4 h-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {/* Join Community Section */}
                <div className="mt-16 bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 shadow-sm border border-gray-100">
                  <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Werde Teil unserer Sport-Community</h2>
                    <p className="text-gray-600 mb-8">
                      Entdecke Gleichgesinnte, organisiere gemeinsame Aktivitäten und teile deine Leidenschaft für Sport. 
                      In unserer Community findet jeder seinen Platz – vom Anfänger bis zum Profi.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
                          <Users className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Gruppen finden</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Entdecke Sportgruppen, die zu deinen Interessen und deinem Niveau passen.
                        </p>
                        <Link href="/groups" className="text-indigo-600 hover:underline text-sm font-medium">
                          Jetzt entdecken →
                        </Link>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                          <PlusCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Gruppe gründen</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Starte deine eigene Sportgruppe und finde Mitglieder mit gleichen Interessen.
                        </p>
                        <Link href="/groups/create" className="text-blue-600 hover:underline text-sm font-medium">
                          Gruppe erstellen →
                        </Link>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-4">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lokale Aktivitäten</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Entdecke Sportgruppen und Aktivitäten in deiner unmittelbaren Umgebung.
                        </p>
                        <Link href="/events" className="text-green-600 hover:underline text-sm font-medium">
                          Veranstaltungen ansehen →
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