'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HierarchicalFilter, HierarchicalOption } from '@/components/ui/hierarchical-filter';
import { allSports, getSportsByCategory, sportsCategories } from '@/lib/sportsData';
import { Badge } from '@/components/ui/badge';
import { X, Calendar } from 'lucide-react';

interface Sport {
  value: string;
  label: string;
  count: number;
}

interface EventsFilterProps {
  sports: Sport[];
  selectedSports: string[];
  currentSport?: string;
  currentTimeframe?: string;
}

export default function EventsFilter({ 
  sports, 
  selectedSports,
  currentSport,
  currentTimeframe
}: EventsFilterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedSports);
  const [timeFilter, setTimeFilter] = useState<string>(currentTimeframe || '');
  
  // Effect to update selection when props change
  useEffect(() => {
    if (selectedSports.length > 0 && JSON.stringify(selectedSports) !== JSON.stringify(selected)) {
      setSelected(selectedSports);
    }
    if (currentTimeframe !== timeFilter) {
      setTimeFilter(currentTimeframe || '');
    }
  }, [selectedSports, currentTimeframe, selected, timeFilter]);

  // Build hierarchical options from sports data
  const sportsByCategory = getSportsByCategory();
  
  const hierarchicalOptions: HierarchicalOption[] = sportsCategories.map(category => ({
    id: category,
    label: category,
    value: category,
    children: sportsByCategory[category]
      .filter(sport => sports.some(s => s.value === sport.value)) // Only include sports that have events
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
    updateUrlWithFilters(values, timeFilter);
  };

  // Handle timeframe selection change
  const handleTimeframeChange = (timeframe: string) => {
    setTimeFilter(timeframe);
    updateUrlWithFilters(selected, timeframe);
  };

  // Update URL with all active filters
  const updateUrlWithFilters = (sports: string[], timeframe: string) => {
    let url = '/events';
    const params = new URLSearchParams();
    
    if (sports.length > 0) {
      params.set('sports', sports.join(','));
    }
    
    if (timeframe) {
      params.set('timeframe', timeframe);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    router.push(url);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelected([]);
    setTimeFilter('');
    router.push('/events');
  };

  // Determine if we should show the clear filter button
  const hasFilters = selected.length > 0 || timeFilter;

  // Timeframe options
  const timeframes = [
    { value: 'today', label: 'Heute' },
    { value: 'tomorrow', label: 'Morgen' },
    { value: 'thisWeek', label: 'Diese Woche' },
    { value: 'thisMonth', label: 'Diesen Monat' },
    { value: 'future', label: 'Zukünftig' },
  ];

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
                    updateUrlWithFilters(newSelected, timeFilter);
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

      {/* Timeframe filter */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Nach Zeitraum filtern</h2>
        <div className="space-y-2">
          <Link
            href="/events"
            className={`block px-3 py-2 rounded-md ${
              !timeFilter
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Alle Veranstaltungen</span>
            </div>
          </Link>
          {timeframes.map((tf) => (
            <div 
              key={tf.value} 
              className={`block px-3 py-2 rounded-md cursor-pointer ${
                timeFilter === tf.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => handleTimeframeChange(timeFilter === tf.value ? '' : tf.value)}
            >
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{tf.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create event button */}
      <div>
        <Button className="w-full" asChild>
          <Link href="/events/create">Neue Veranstaltung erstellen</Link>
        </Button>
      </div>

      {/* Calendar view link */}
      <div className="mt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/events/calendar" className="flex items-center justify-center">
            <Calendar className="mr-2 h-4 w-4" />
            Kalenderansicht
          </Link>
        </Button>
      </div>
    </div>
  );
} 