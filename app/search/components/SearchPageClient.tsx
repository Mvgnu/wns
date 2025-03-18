'use client';

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HierarchicalFilter, HierarchicalOption } from "@/components/ui/hierarchical-filter";
import SearchResults from "./SearchResults";
import { Search as SearchIcon, Filter, X, Loader2, Calendar, MapPin, Users, Tag } from "lucide-react";
import { allSports, getSportsByCategory, sportsCategories } from "@/lib/sportsData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { debounce } from "lodash";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface SearchParams {
  query: string;
  type: string;
  sports: string[];
  date?: Date;
  location?: string;
  isRecurring?: boolean;
  isPrivate?: boolean;
}

interface SearchPageClientProps {
  initialQuery: string;
  initialType: string;
  initialSports: string[];
}

export default function SearchPageClient({ 
  initialQuery, 
  initialType, 
  initialSports 
}: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>(initialType || "all");
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean | undefined>(undefined);
  const [isPrivateGroup, setIsPrivateGroup] = useState<boolean | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Convert sports data to hierarchical options
  const sportsOptions: HierarchicalOption[] = useMemo(() => {
    const sportsByCategory = getSportsByCategory();
    return sportsCategories.map(category => ({
      id: category,
      label: category,
      value: category,
      children: sportsByCategory[category].map(sport => ({
        id: sport.value,
        label: sport.label,
        value: sport.value,
        parent: category
      }))
    }));
  }, []);

  // Create a search params object for consistent handling
  const currentSearchParams = useMemo<SearchParams>(() => ({
    query: searchQuery,
    type: selectedType,
    sports: selectedSports,
    date: selectedDate,
    location: selectedLocation,
    isRecurring,
    isPrivate: isPrivateGroup
  }), [
    searchQuery, 
    selectedType, 
    selectedSports, 
    selectedDate, 
    selectedLocation, 
    isRecurring, 
    isPrivateGroup
  ]);
  
  // Generate query string from search params
  const buildSearchUrl = useCallback((params: SearchParams): string => {
    const { query, type, sports, date, location, isRecurring, isPrivate } = params;
    let searchUrl = `/search?q=${encodeURIComponent(query)}`;
    
    if (type !== "all") {
      searchUrl += `&type=${encodeURIComponent(type)}`;
    }
    
    if (sports.length > 0) {
      searchUrl += `&sports=${encodeURIComponent(sports.join(','))}`;
    }

    if (date) {
      searchUrl += `&date=${format(date, 'yyyy-MM-dd')}`;
    }

    if (location) {
      searchUrl += `&location=${encodeURIComponent(location)}`;
    }

    if (isRecurring !== undefined) {
      searchUrl += `&isRecurring=${isRecurring}`;
    }

    if (isPrivate !== undefined) {
      searchUrl += `&isPrivate=${isPrivate}`;
    }
    
    return searchUrl;
  }, []);

  // Generate API URL from search params
  const buildApiUrl = useCallback((params: SearchParams): string => {
    const { query, type, sports, date, location, isRecurring, isPrivate } = params;
    let apiUrl = `/api/search?q=${encodeURIComponent(query)}`;
    
    if (type !== "all") {
      apiUrl += `&type=${encodeURIComponent(type)}`;
    }
    
    if (sports.length > 0) {
      apiUrl += `&sports=${encodeURIComponent(sports.join(','))}`;
    }

    if (date) {
      apiUrl += `&date=${format(date, 'yyyy-MM-dd')}`;
    }

    if (location) {
      apiUrl += `&location=${encodeURIComponent(location)}`;
    }

    if (isRecurring !== undefined) {
      apiUrl += `&isRecurring=${isRecurring}`;
    }

    if (isPrivate !== undefined) {
      apiUrl += `&isPrivate=${isPrivate}`;
    }
    
    return apiUrl;
  }, []);

  // Fetch search results function
  const fetchSearchResults = useCallback(async (params: SearchParams) => {
    if (!params.query.trim()) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const apiUrl = buildApiUrl(params);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "An error occurred while searching");
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An error occurred while searching",
        variant: "destructive"
      });
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl, toast]);

  // Debounced fetch
  const debouncedFetch = useMemo(() => 
    debounce((params: SearchParams) => {
      fetchSearchResults(params);
      
      // Update URL without navigation
      const newUrl = buildSearchUrl(params);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', newUrl);
      }
    }, 300),
    [fetchSearchResults, buildSearchUrl]
  );

  // Effect for handling search parameter changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedFetch(currentSearchParams);
    } else {
      setSearchResults(null);
      setIsLoading(false);
    }
  }, [currentSearchParams, debouncedFetch, searchQuery]);

  // Initial fetch on mount
  useEffect(() => {
    if (initialQuery) {
      setIsLoading(true);
      fetchSearchResults({
        query: initialQuery,
        type: initialType,
        sports: initialSports,
        date: selectedDate,
        location: selectedLocation,
        isRecurring,
        isPrivate: isPrivateGroup
      });
    }
  }, [
    initialQuery, 
    initialType, 
    initialSports, 
    selectedDate, 
    selectedLocation, 
    isRecurring, 
    isPrivateGroup, 
    fetchSearchResults
  ]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the URL with the current search parameters
    const searchUrl = buildSearchUrl(currentSearchParams);
    router.push(searchUrl);
  };

  // Handle type selection change
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  // Handle sports filter change
  const handleSportsChange = (values: string[]) => {
    setSelectedSports(values);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedType("all");
    setSelectedSports([]);
    setSelectedDate(undefined);
    setSelectedLocation("");
    setIsRecurring(undefined);
    setIsPrivateGroup(undefined);
  };

  // Get selected sports labels for display
  const selectedSportsLabels = useMemo(() => 
    selectedSports.map(sportValue => {
      const sport = allSports.find(s => s.value === sportValue);
      return sport ? sport.label : sportValue;
    }), 
    [selectedSports]
  );

  // Count active filters
  const activeFiltersCount = useMemo(() => 
    (selectedType !== "all" ? 1 : 0) + 
    selectedSports.length +
    (selectedDate ? 1 : 0) +
    (selectedLocation ? 1 : 0) +
    (isRecurring !== undefined ? 1 : 0) +
    (isPrivateGroup !== undefined ? 1 : 0),
    [
      selectedType, 
      selectedSports, 
      selectedDate, 
      selectedLocation, 
      isRecurring, 
      isPrivateGroup
    ]
  );

  return (
    <div className="container py-8 px-4 md:px-8">
      <div className="flex flex-col space-y-8">
        {/* Hero section with search */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-6">Suche</h1>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4 relative">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Nach Sportarten, Gruppen, Events oder Orten suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Button type="submit" variant="secondary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Suchen
            </Button>
          </form>
          
          {/* Mobile filter button */}
          <div className="flex md:hidden justify-between items-center">
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Suchfilter</SheetTitle>
                  <SheetDescription>
                    Verfeinere deine Suche mit diesen Filtern
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="sportarten">
                      <AccordionTrigger>Sportarten</AccordionTrigger>
                      <AccordionContent>
                        <HierarchicalFilter
                          options={sportsOptions}
                          selected={selectedSports}
                          onChange={handleSportsChange}
                          placeholder="Sportarten auswählen"
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="type">
                      <AccordionTrigger>Typ</AccordionTrigger>
                      <AccordionContent>
                        <Tabs value={selectedType} onValueChange={handleTypeChange} className="w-full">
                          <TabsList className="w-full">
                            <TabsTrigger value="all" className="flex-1">Alle</TabsTrigger>
                            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                            <TabsTrigger value="groups" className="flex-1">Gruppen</TabsTrigger>
                            <TabsTrigger value="locations" className="flex-1">Orte</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </AccordionContent>
                    </AccordionItem>
                    {(selectedType === "events" || selectedType === "all") && (
                      <AccordionItem value="events">
                        <AccordionTrigger>Event Filter</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Datum</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {selectedDate ? format(selectedDate, "PPP") : "Datum auswählen"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Ort</label>
                            <Input
                              placeholder="Nach Ort suchen..."
                              value={selectedLocation}
                              onChange={(e) => setSelectedLocation(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Wiederkehrend</label>
                            <div className="flex gap-2">
                              <Button
                                variant={isRecurring === true ? "default" : "outline"}
                                onClick={() => setIsRecurring(true)}
                                className="flex-1"
                              >
                                Ja
                              </Button>
                              <Button
                                variant={isRecurring === false ? "default" : "outline"}
                                onClick={() => setIsRecurring(false)}
                                className="flex-1"
                              >
                                Nein
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {(selectedType === "groups" || selectedType === "all") && (
                      <AccordionItem value="groups">
                        <AccordionTrigger>Gruppen Filter</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Privat</label>
                            <div className="flex gap-2">
                              <Button
                                variant={isPrivateGroup === true ? "default" : "outline"}
                                onClick={() => setIsPrivateGroup(true)}
                                className="flex-1"
                              >
                                Ja
                              </Button>
                              <Button
                                variant={isPrivateGroup === false ? "default" : "outline"}
                                onClick={() => setIsPrivateGroup(false)}
                                className="flex-1"
                              >
                                Nein
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active filters */}
        {(activeFiltersCount > 0 || error) && (
          <div className="flex flex-wrap gap-2 items-center">
            {error && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <X className="h-3 w-3" />
                {error}
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {selectedType}
              </Badge>
            )}
            {selectedSports.map((sport) => (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {sport}
              </Badge>
            ))}
            {selectedDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(selectedDate, "PPP")}
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedLocation}
              </Badge>
            )}
            {isRecurring !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isRecurring ? "Wiederkehrend" : "Einmalig"}
              </Badge>
            )}
            {isPrivateGroup !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {isPrivateGroup ? "Privat" : "Öffentlich"}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Filter zurücksetzen
            </Button>
          </div>
        )}

        {/* Search results */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <SearchResults 
            results={searchResults} 
            type={selectedType}
            query={searchQuery}
          />
        )}
      </div>
    </div>
  );
} 