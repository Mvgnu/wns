'use client';

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HierarchicalFilter, HierarchicalOption } from "@/components/ui/hierarchical-filter";
import SearchResults from "./SearchResults";
import { Search as SearchIcon, Filter, X, Loader2 } from "lucide-react";
import { allSports, getSportsByCategory, sportsCategories, Sport } from "@/lib/sportsData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { debounce } from "lodash";

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
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>(initialType || "all");
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Convert sports data to hierarchical options
  const sportsOptions: HierarchicalOption[] = React.useMemo(() => {
    // Create map of categories to sports
    const sportsByCategory = getSportsByCategory();
    
    // Convert to hierarchical options format
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

  // Define a debounced search function
  const debouncedFetch = useCallback(
    debounce((query: string, type: string, sports: string[]) => {
      if (!query) {
        setSearchResults(null);
        setIsLoading(false);
        return;
      }
      
      const fetchResults = async () => {
        try {
          // Build the API URL with all parameters
          let url = `/api/search?q=${encodeURIComponent(query)}`;
          
          // Add type filter if not "all"
          if (type && type !== "all") {
            url += `&type=${encodeURIComponent(type)}`;
          }
          
          // Add sports filter if present
          if (sports && sports.length > 0) {
            url += `&sports=${encodeURIComponent(sports.join(','))}`;
          }
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }
          
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Search error:", error);
          // Handle error state here
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchResults();
    }, 300),
    []
  );

  // Handle live search as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      debouncedFetch(searchQuery, selectedType, selectedSports);
      
      // Update URL with current search parameters (without navigating)
      const newUrl = buildSearchUrl(searchQuery, selectedType, selectedSports);
      window.history.replaceState({}, '', newUrl);
    } else {
      setSearchResults(null);
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedSports, debouncedFetch]);

  // Fetch search results for the initial query
  useEffect(() => {
    if (initialQuery) {
      setIsLoading(true);
      debouncedFetch(initialQuery, initialType, initialSports);
    }
  }, [initialQuery, initialType, initialSports, debouncedFetch]);

  // Build search URL
  const buildSearchUrl = (query: string, type: string, sports: string[]) => {
    let searchUrl = `/search?q=${encodeURIComponent(query)}`;
    
    // Add type if not "all"
    if (type !== "all") {
      searchUrl += `&type=${encodeURIComponent(type)}`;
    }
    
    // Add sports if selected
    if (sports.length > 0) {
      searchUrl += `&sports=${encodeURIComponent(sports.join(','))}`;
    }
    
    return searchUrl;
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the URL with the current search parameters
    let searchUrl = buildSearchUrl(searchQuery, selectedType, selectedSports);
    
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
  };

  // Get selected sports labels for display
  const selectedSportsLabels = selectedSports.map(sportValue => {
    const sport = allSports.find(s => s.value === sportValue);
    return sport ? sport.label : sportValue;
  });

  // Count active filters
  const activeFiltersCount = 
    (selectedType !== "all" ? 1 : 0) + 
    selectedSports.length;

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
                          maxHeight="400px"
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="type">
                      <AccordionTrigger>Typ</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2">
                          {["all", "groups", "events", "locations", "users"].map((type) => (
                            <Button
                              key={type}
                              variant={selectedType === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTypeChange(type)}
                            >
                              {type === "all" ? "Alle" : 
                               type === "groups" ? "Gruppen" : 
                               type === "events" ? "Events" : 
                               type === "locations" ? "Orte" : "Nutzer"}
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        clearFilters();
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      Zurücksetzen
                    </Button>
                    <Button onClick={() => setIsMobileFilterOpen(false)}>
                      Anwenden
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Display active filters on mobile */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                {selectedType !== "all" && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {selectedType === "groups" ? "Gruppen" : 
                     selectedType === "events" ? "Events" : 
                     selectedType === "locations" ? "Orte" : "Nutzer"}
                    <button 
                      className="ml-1 hover:text-gray-700" 
                      onClick={() => setSelectedType("all")}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                )}
                
                {selectedSportsLabels.slice(0, 2).map((sport) => (
                  <Badge key={sport} variant="secondary" className="whitespace-nowrap">
                    {sport}
                    <button 
                      className="ml-1 hover:text-gray-700" 
                      onClick={() => {
                        setSelectedSports(
                          selectedSports.filter(s => 
                            allSports.find(as => as.value === s)?.label !== sport
                          )
                        );
                      }}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
                
                {selectedSports.length > 2 && (
                  <Badge variant="secondary">
                    +{selectedSports.length - 2} weitere
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area with filters and results */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filter</h2>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Zurücksetzen
                  </Button>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Typ</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Alle" },
                      { value: "groups", label: "Gruppen" },
                      { value: "events", label: "Events" },
                      { value: "locations", label: "Orte" },
                      { value: "users", label: "Nutzer" }
                    ].map((type) => (
                      <Button
                        key={type.value}
                        variant={selectedType === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTypeChange(type.value)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Sportarten</h3>
                  <HierarchicalFilter
                    options={sportsOptions}
                    selected={selectedSports}
                    onChange={handleSportsChange}
                    placeholder="Sportarten auswählen"
                    maxHeight="400px"
                  />
                </div>
              </div>
            </div>
            
            {selectedSports.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium mb-2">Ausgewählte Sportarten</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSportsLabels.map((sport) => (
                    <Badge key={sport} variant="secondary" className="whitespace-nowrap">
                      {sport}
                      <button 
                        className="ml-1 hover:text-gray-700" 
                        onClick={() => {
                          setSelectedSports(
                            selectedSports.filter(s => 
                              allSports.find(as => as.value === s)?.label !== sport
                            )
                          );
                        }}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Results area */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Type tabs for desktop */}
              <div className="hidden md:block mb-6">
                <Tabs 
                  value={selectedType} 
                  onValueChange={handleTypeChange}
                  className="w-full"
                >
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="all">Alle</TabsTrigger>
                    <TabsTrigger value="groups">Gruppen</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="locations">Orte</TabsTrigger>
                    <TabsTrigger value="users">Nutzer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Results count */}
              {searchQuery && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    {isLoading ? (
                      <Skeleton className="h-7 w-48" />
                    ) : searchResults ? (
                      `Ergebnisse für "${searchQuery}"`
                    ) : (
                      `Keine Ergebnisse für "${searchQuery}"`
                    )}
                  </h2>
                </div>
              )}
              
              {/* Search results or placeholder */}
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-32" />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((j) => (
                          <Skeleton key={j} className="h-64 w-full rounded-md" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                searchResults ? (
                  <SearchResults results={searchResults} type={selectedType} />
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 mb-4">Keine Ergebnisse gefunden</p>
                    <p className="text-sm text-gray-400">Versuche es mit einem anderen Suchbegriff oder anderen Filtern</p>
                  </div>
                )
              ) : (
                <div className="py-16 text-center">
                  <SearchIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Suche starten</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Gib einen Suchbegriff ein, um nach Gruppen, Events, Orten oder Nutzern zu suchen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 