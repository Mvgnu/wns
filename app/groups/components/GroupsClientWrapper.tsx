"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GroupsFilter from "./GroupsFilter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, MapPin, ChevronRight, PlusCircle, Shield, Lock, Activity, Tag, Calendar, Trophy, Users2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

interface GroupsClientWrapperProps {
  groups: Group[];
  sportCounts: any[];
  selectedSports: string[];
  currentSport: string;
  allSports: any[];
  totalGroupCount: number;
  userId?: string;
  sportsClubs: Group[];
  userGroups: Group[];
  groupType: string;
}

export default function GroupsClientWrapper({
  groups,
  sportCounts,
  selectedSports,
  currentSport,
  allSports,
  totalGroupCount,
  userId,
  sportsClubs,
  userGroups,
  groupType
}: GroupsClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [activeTab, setActiveTab] = useState(groupType || 'all');
  
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'all') {
      params.set("type", value);
    } else {
      params.delete("type");
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

  // Function to get activity level badge color
  const getActivityLevelColor = (level: string | null | undefined) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'archived':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get translated activity level
  const getActivityLevelText = (level: string | null | undefined) => {
    switch (level) {
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return 'Nicht angegeben';
    }
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
              
                {/* Group type filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Gruppentyp</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Button 
                        variant={activeTab === "all" ? "default" : "ghost"} 
                        size="sm" 
                        className="w-full justify-start text-sm font-normal"
                        onClick={() => handleTabChange("all")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Alle Gruppen
                        <Badge className="ml-auto">{groups.length}</Badge>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button 
                        variant={activeTab === "clubs" ? "default" : "ghost"} 
                        size="sm" 
                        className="w-full justify-start text-sm font-normal"
                        onClick={() => handleTabChange("clubs")}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Sportvereine
                        <Badge className="ml-auto">{sportsClubs.length}</Badge>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button 
                        variant={activeTab === "groups" ? "default" : "ghost"} 
                        size="sm" 
                        className="w-full justify-start text-sm font-normal"
                        onClick={() => handleTabChange("groups")}
                      >
                        <Users2 className="h-4 w-4 mr-2" />
                        Hobbygruppen
                        <Badge className="ml-auto">{userGroups.length}</Badge>
                      </Button>
                    </div>
                  </div>
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
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchParam
                    ? `Suchergebnisse für "${searchParam}"`
                    : sportParam
                    ? `${allSports.find(s => s.value === sportParam)?.label || sportParam} Gruppen` 
                    : activeTab === "clubs"
                    ? "Sportvereine"
                    : activeTab === "groups"
                    ? "Hobbygruppen"
                    : "Alle Gruppen"}
                </h2>
                
                {/* Active filters */}
                {(searchParam || sportParam || selectedSports.length > 0 || activeTab !== "all") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                  {searchParam && (
                      <Badge variant="outline" className="pl-2 pr-1.5 py-1.5 flex items-center gap-1.5 bg-white">
                        <span>Suche: {searchParam}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                          onClick={() => removeFilter("search")}
                        >
                          <span className="sr-only">Entfernen</span>
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.225 5.775C0.075 5.625 0 5.4375 0 5.25C0 5.0625 0.075 4.875 0.225 4.725L1.95 3L0.225 1.275C0.075 1.125 0 0.9375 0 0.75C0 0.5625 0.075 0.375 0.225 0.225C0.375 0.075 0.5625 0 0.75 0C0.9375 0 1.125 0.075 1.275 0.225L3 1.95L4.725 0.225C4.875 0.075 5.0625 0 5.25 0C5.4375 0 5.625 0.075 5.775 0.225C5.925 0.375 6 0.5625 6 0.75C6 0.9375 5.925 1.125 5.775 1.275L4.05 3L5.775 4.725C5.925 4.875 6 5.0625 6 5.25C6 5.4375 5.925 5.625 5.775 5.775C5.625 5.925 5.4375 6 5.25 6C5.0625 6 4.875 5.925 4.725 5.775L3 4.05L1.275 5.775C1.125 5.925 0.9375 6 0.75 6C0.5625 6 0.375 5.925 0.225 5.775Z" fill="currentColor"/>
                          </svg>
                        </Button>
                    </Badge>
                  )}
                  
                  {sportParam && (
                      <Badge variant="outline" className="pl-2 pr-1.5 py-1.5 flex items-center gap-1.5 bg-white">
                        <span>Sportart: {allSports.find(s => s.value === sportParam)?.label || sportParam}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                          onClick={() => removeFilter("sport")}
                        >
                          <span className="sr-only">Entfernen</span>
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.225 5.775C0.075 5.625 0 5.4375 0 5.25C0 5.0625 0.075 4.875 0.225 4.725L1.95 3L0.225 1.275C0.075 1.125 0 0.9375 0 0.75C0 0.5625 0.075 0.375 0.225 0.225C0.375 0.075 0.5625 0 0.75 0C0.9375 0 1.125 0.075 1.275 0.225L3 1.95L4.725 0.225C4.875 0.075 5.0625 0 5.25 0C5.4375 0 5.625 0.075 5.775 0.225C5.925 0.375 6 0.5625 6 0.75C6 0.9375 5.925 1.125 5.775 1.275L4.05 3L5.775 4.725C5.925 4.875 6 5.0625 6 5.25C6 5.4375 5.925 5.625 5.775 5.775C5.625 5.925 5.4375 6 5.25 6C5.0625 6 4.875 5.925 4.725 5.775L3 4.05L1.275 5.775C1.125 5.925 0.9375 6 0.75 6C0.5625 6 0.375 5.925 0.225 5.775Z" fill="currentColor"/>
                          </svg>
                        </Button>
                    </Badge>
                  )}
                  
                    {selectedSports.map(sport => (
                      <Badge key={sport} variant="outline" className="pl-2 pr-1.5 py-1.5 flex items-center gap-1.5 bg-white">
                        <span>Sportart: {allSports.find(s => s.value === sport)?.label || sport}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                          onClick={() => removeFilter("sports", sport)}
                        >
                          <span className="sr-only">Entfernen</span>
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.225 5.775C0.075 5.625 0 5.4375 0 5.25C0 5.0625 0.075 4.875 0.225 4.725L1.95 3L0.225 1.275C0.075 1.125 0 0.9375 0 0.75C0 0.5625 0.075 0.375 0.225 0.225C0.375 0.075 0.5625 0 0.75 0C0.9375 0 1.125 0.075 1.275 0.225L3 1.95L4.725 0.225C4.875 0.075 5.0625 0 5.25 0C5.4375 0 5.625 0.075 5.775 0.225C5.925 0.375 6 0.5625 6 0.75C6 0.9375 5.925 1.125 5.775 1.275L4.05 3L5.775 4.725C5.925 4.875 6 5.0625 6 5.25C6 5.4375 5.925 5.625 5.775 5.775C5.625 5.925 5.4375 6 5.25 6C5.0625 6 4.875 5.925 4.725 5.775L3 4.05L1.275 5.775C1.125 5.925 0.9375 6 0.75 6C0.5625 6 0.375 5.925 0.225 5.775Z" fill="currentColor"/>
                          </svg>
                        </Button>
                    </Badge>
                  ))}
                  
                    {/* Type filter badge */}
                    {activeTab !== "all" && (
                      <Badge variant="outline" className="pl-2 pr-1.5 py-1.5 flex items-center gap-1.5 bg-white">
                        <span>Typ: {activeTab === "clubs" ? "Sportvereine" : "Hobbygruppen"}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                          onClick={() => handleTabChange("all")}
                        >
                          <span className="sr-only">Entfernen</span>
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.225 5.775C0.075 5.625 0 5.4375 0 5.25C0 5.0625 0.075 4.875 0.225 4.725L1.95 3L0.225 1.275C0.075 1.125 0 0.9375 0 0.75C0 0.5625 0.075 0.375 0.225 0.225C0.375 0.075 0.5625 0 0.75 0C0.9375 0 1.125 0.075 1.275 0.225L3 1.95L4.725 0.225C4.875 0.075 5.0625 0 5.25 0C5.4375 0 5.625 0.075 5.775 0.225C5.925 0.375 6 0.5625 6 0.75C6 0.9375 5.925 1.125 5.775 1.275L4.05 3L5.775 4.725C5.925 4.875 6 5.0625 6 5.25C6 5.4375 5.925 5.625 5.775 5.775C5.625 5.925 5.4375 6 5.25 6C5.0625 6 4.875 5.925 4.725 5.775L3 4.05L1.275 5.775C1.125 5.925 0.9375 6 0.75 6C0.5625 6 0.375 5.925 0.225 5.775Z" fill="currentColor"/>
                          </svg>
                        </Button>
                      </Badge>
                    )}
                    
                    {(searchParam || sportParam || selectedSports.length > 0 || activeTab !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={clearAllFilters}
                      >
                        Alle Filter löschen
                  </Button>
                    )}
                </div>
                )}
              </div>
            </div>
            
            {/* Display tabs for mobile view */}
            <div className="mb-6 md:hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="clubs">Vereine</TabsTrigger>
                  <TabsTrigger value="groups">Gruppen</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Groups Grid */}
            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => {
                  // Determine if this is a sports club or regular group
                  const isSportsClub = sportsClubs.some(club => club.id === group.id);
                  
                  return (
                    <Card 
                      key={group.id} 
                      className={`overflow-hidden transition-all duration-300 hover:shadow-md bg-white border ${
                        isSportsClub ? 'border-indigo-200' : 'border-gray-100'
                      } ${isSportsClub ? 'ring-1 ring-indigo-100' : ''}`}
                    >
                      <div className={`aspect-[4/3] relative overflow-hidden ${isSportsClub ? 'border-b border-indigo-100' : ''}`}>
                        {group.image ? (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full ${
                            isSportsClub 
                              ? 'bg-gradient-to-br from-indigo-600 to-blue-700' 
                              : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                          } flex items-center justify-center`}>
                            <span className="text-white font-bold text-4xl">{group.name[0]}</span>
                          </div>
                        )}
                        {isSportsClub && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-indigo-100 text-indigo-800 font-medium border-0">
                              <Trophy className="h-3 w-3 mr-1" />
                              Sportverein
                            </Badge>
                          </div>
                        )}
                        {group.isPrivate && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-amber-700 font-medium border-amber-200">
                              <Lock className="h-3 w-3 mr-1" />
                              Privat
                            </Badge>
                          </div>
                        )}
                        {group.status && group.status !== 'active' && (
                          <div className={`absolute ${!group.isPrivate ? 'top-3 right-3' : 'bottom-3 right-3'}`}>
                            <Badge className={`${getStatusColor(group.status)} font-medium`}>
                              {group.status === 'inactive' ? 'Inaktiv' : 'Archiviert'}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className={`p-4 space-y-4 ${isSportsClub ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={`${
                            isSportsClub 
                              ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          } border-0`}>
                              {allSports.find(s => s.value === group.sport)?.label || group.sport}
                          </Badge>
                          
                          {group.activityLevel && (
                            <Badge variant="outline" className={`${getActivityLevelColor(group.activityLevel)}`}>
                              <Activity className="h-3 w-3 mr-1" />
                              {getActivityLevelText(group.activityLevel)}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className={`font-semibold text-xl ${
                          isSportsClub ? 'text-indigo-950' : 'text-gray-900'
                        } leading-tight`}>
                          <Link href={`/groups/${group.id}`} className={`${
                            isSportsClub ? 'hover:text-indigo-700' : 'hover:text-indigo-600'
                          } transition-colors`}>
                            {group.name}
                          </Link>
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {group.description || "Keine Beschreibung vorhanden."}
                        </p>
                        
                        {group.groupTags && group.groupTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {group.groupTags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className={`text-xs font-normal ${
                                isSportsClub ? 'text-indigo-600 border-indigo-200' : 'text-gray-600 border-gray-200'
                              }`}>
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {group.groupTags.length > 3 && (
                              <Badge variant="outline" className={`text-xs font-normal ${
                                isSportsClub ? 'text-indigo-600 border-indigo-200' : 'text-gray-600 border-gray-200'
                              }`}>
                                +{group.groupTags.length - 3} mehr
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <Users className="h-3.5 w-3.5 mr-1.5" />
                          <span>{group._count.members} {group._count.members === 1 ? "Mitglied" : "Mitglieder"}</span>
                        </div>
                        
                        {group.locationName && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                            <span className="truncate">{group.locationName || group.city}</span>
                          </div>
                        )}
                        
                        {group.requireApproval && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs font-normal ${
                              isSportsClub ? 'text-indigo-600 border-indigo-200' : 'text-gray-600 border-gray-200'
                            }`}>
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              Freigabe erforderlich
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className={`p-4 pt-0 flex justify-between items-center ${
                        isSportsClub ? 'bg-indigo-50/30' : ''
                      }`}>
                        <div className="flex items-center text-gray-500 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Aktiv</span>
                        </div>
                        
                        <Button 
                          variant={isSportsClub ? "default" : "outline"}
                          size="sm" 
                          className={isSportsClub ? "rounded-full" : "rounded-full"} 
                          asChild
                        >
                          <Link href={`/groups/${group.id}`}>
                            <span className="mr-1">Details</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="mx-auto w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Gruppen gefunden</h3>
                <p className="text-gray-600 mb-6">Es wurden keine Gruppen gefunden, die deinen Suchkriterien entsprechen.</p>
                <Button onClick={clearAllFilters}>
                  Alle Filter zurücksetzen
                </Button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 