"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface LocationResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchProps {
  initialValue?: LocationResult;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
}

export default function LocationSearch({ 
  initialValue, 
  onSelect,
  placeholder = "Suche nach einem Ort..."
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LocationResult | undefined>(initialValue);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  
  const searchTimeout = useRef<NodeJS.Timeout>();
  
  // Try to get user's location on first render
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        error => {
          console.error('Error getting user location:', error);
          // Default to Germany if location access is denied
          setUserLocation({
            lat: 51.1657, // Roughly center of Germany
            lon: 10.4515
          });
        }
      );
    }
  }, []);
  
  // Search for locations when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      return;
    }
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Set a new timeout to avoid too many requests
    searchTimeout.current = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);
  
  const searchLocations = async (query: string) => {
    setLoading(true);
    
    try {
      // Build the search URL with user location if available
      let searchUrl = `/api/locations/search?q=${encodeURIComponent(query)}`;
      if (userLocation) {
        searchUrl += `&lat=${userLocation.lat}&lon=${userLocation.lon}`;
      }
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: 'Fehler',
        description: 'Orte konnten nicht gesucht werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = (location: LocationResult) => {
    setSelected(location);
    setOpen(false);
    onSelect(location);
  };
  
  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected ? (
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{selected.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Suche nach Orten..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <CommandList>
              <CommandEmpty>
                {searchQuery.length < 3 
                  ? 'Gib mindestens 3 Zeichen ein...' 
                  : 'Keine Ergebnisse gefunden'}
              </CommandEmpty>
              <CommandGroup>
                {results.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={location.id}
                    onSelect={() => handleSelect(location)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{location.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 