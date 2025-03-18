'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HierarchicalFilter, HierarchicalOption } from '@/components/ui/hierarchical-filter';
import { allSports, getSportsByCategory, sportsCategories } from '@/lib/sportsData';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Sport {
  value: string;
  label: string;
  count: number;
}

interface LocationType {
  value: string;
  count: number;
}

interface LocationsFilterProps {
  sports: Sport[];
  types: LocationType[];
  selectedSports: string[];
  selectedType: string;
}

export default function LocationsFilter({ 
  sports, 
  types, 
  selectedSports, 
  selectedType 
}: LocationsFilterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedSports);
  const [typeFilter, setTypeFilter] = useState<string>(selectedType);
  const [typeSearch, setTypeSearch] = useState<string>('');
  
  // Effect to update selection when props change
  useEffect(() => {
    if (selectedSports.length > 0 && JSON.stringify(selectedSports) !== JSON.stringify(selected)) {
      setSelected(selectedSports);
    }
    if (selectedType !== typeFilter) {
      setTypeFilter(selectedType);
    }
  }, [selectedSports, selectedType, selected, typeFilter]);

  // Build hierarchical options from sports data
  const sportsByCategory = getSportsByCategory();
  
  const hierarchicalOptions: HierarchicalOption[] = sportsCategories.map(category => ({
    id: category,
    label: category,
    value: category,
    children: sportsByCategory[category]
      .filter(sport => sports.some(s => s.value === sport.value)) // Only include sports that have locations
      .map(sport => {
        // Find the count for this sport
        const sportWithCount = sports.find(s => s.value === sport.value);
        return {
          id: sport.value,
          label: `${sport.label} (${sportWithCount?.count || 0})`,
          value: sport.value,
          parent: category
        };
      })
  }));

  // Remove categories with no sports
  const filteredOptions = hierarchicalOptions.filter(
    option => option.children && option.children.length > 0
  );

  // Handle sports selection change
  const handleSportsSelectionChange = (values: string[]) => {
    setSelected(values);
    updateUrlWithFilters(values, typeFilter);
  };

  // Handle type selection change
  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    updateUrlWithFilters(selected, type);
  };

  // Update URL with all active filters
  const updateUrlWithFilters = (sports: string[], type: string) => {
    let url = '/locations';
    const params = new URLSearchParams();
    
    if (sports.length > 0) {
      params.set('sports', sports.join(','));
    }
    
    if (type) {
      params.set('type', type);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    router.push(url);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelected([]);
    setTypeFilter('');
    setTypeSearch('');
    router.push('/locations');
  };

  // Filter types based on search
  const filteredTypes = typeSearch 
    ? types.filter(type => type.value.toLowerCase().includes(typeSearch.toLowerCase()))
    : types;

  // Determine if we should show the clear filter button
  const hasFilters = selected.length > 0 || typeFilter;

  return (
    <div className="space-y-6">
      {/* Sports filter */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Nach Sportart filtern</h2>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-4 w-4" />
              Zurücksetzen
            </Button>
          )}
        </div>

        {/* Active sports filters display */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map(sport => (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1">
                {allSports.find(s => s.value === sport)?.label || sport}
                <button 
                  className="ml-1"
                  onClick={() => {
                    const newSelected = selected.filter(s => s !== sport);
                    setSelected(newSelected);
                    updateUrlWithFilters(newSelected, typeFilter);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Hierarchical Sports Filter */}
        {filteredOptions.length > 0 && (
          <HierarchicalFilter
            options={filteredOptions}
            selected={selected}
            onChange={handleSportsSelectionChange}
            placeholder="Sportarten auswählen"
          />
        )}
      </div>

      {/* Location types filter */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Nach Typ filtern</h2>
        
        {/* Type search input */}
        <div className="mb-4">
          <Label htmlFor="typeSearch" className="sr-only">Typen durchsuchen</Label>
          <Input
            id="typeSearch"
            placeholder="Typen durchsuchen..."
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <Link
            href="/locations"
            className={`block px-3 py-2 rounded-md ${
              !typeFilter
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Alle Typen
          </Link>
          {filteredTypes.map((type) => (
            <div 
              key={type.value} 
              className={`block px-3 py-2 rounded-md cursor-pointer ${
                typeFilter === type.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => handleTypeChange(typeFilter === type.value ? '' : type.value)}
            >
              {type.value} ({type.count})
            </div>
          ))}
          
          {filteredTypes.length === 0 && (
            <div className="text-gray-500 text-sm py-2">
              Keine Typen gefunden für "{typeSearch}"
            </div>
          )}
        </div>
      </div>

      {/* Create location button */}
      <div>
        <Button className="w-full" asChild>
          <Link href="/locations/create">Neuen Ort hinzufügen</Link>
        </Button>
      </div>
    </div>
  );
} 