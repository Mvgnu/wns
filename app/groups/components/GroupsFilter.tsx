'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HierarchicalFilter, HierarchicalOption } from '@/components/ui/hierarchical-filter';
import { allSports, getSportsByCategory, sportsCategories } from '@/lib/sportsData';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Sport {
  value: string;
  label: string;
  count: number;
}

interface GroupsFilterProps {
  sports: Sport[];
  selectedSports: string[];
  currentSport: string;
}

export default function GroupsFilter({ 
  sports, 
  selectedSports, 
  currentSport 
}: GroupsFilterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedSports);
  
  // Effect to update selection when props change
  useEffect(() => {
    if (currentSport && !selected.includes(currentSport)) {
      setSelected([currentSport]);
    } else if (selectedSports.length > 0 && JSON.stringify(selectedSports) !== JSON.stringify(selected)) {
      setSelected(selectedSports);
    }
  }, [currentSport, selectedSports, selected]);

  // Build hierarchical options from sports data
  const sportsByCategory = getSportsByCategory();
  
  const hierarchicalOptions: HierarchicalOption[] = sportsCategories.map(category => ({
    id: category,
    label: category,
    value: category,
    children: sportsByCategory[category]
      .filter(sport => sports.some(s => s.value === sport.value)) // Only include sports that have groups
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

  // Handle selection change
  const handleSelectionChange = (values: string[]) => {
    setSelected(values);
    if (values.length > 0) {
      router.push(`/groups?sports=${values.join(',')}`);
    } else {
      router.push('/groups');
    }
  };

  // Determine if we should show the clear filter button
  const hasFilters = selected.length > 0 || currentSport;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Nach Sportart filtern</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected([]);
              router.push('/groups');
            }}
            className="h-8 px-2 text-xs"
          >
            <X className="mr-1 h-4 w-4" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {currentSport ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              {allSports.find(s => s.value === currentSport)?.label || currentSport}
              <button 
                className="ml-1"
                onClick={() => router.push('/groups')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : selected.map(sport => (
            <Badge key={sport} variant="secondary" className="flex items-center gap-1">
              {allSports.find(s => s.value === sport)?.label || sport}
              <button 
                className="ml-1"
                onClick={() => {
                  const newSelected = selected.filter(s => s !== sport);
                  setSelected(newSelected);
                  if (newSelected.length > 0) {
                    router.push(`/groups?sports=${newSelected.join(',')}`);
                  } else {
                    router.push('/groups');
                  }
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Hierarchical Filter */}
      {filteredOptions.length > 0 && (
        <HierarchicalFilter
          options={filteredOptions}
          selected={selected}
          onChange={handleSelectionChange}
          placeholder="Sportarten auswählen"
          maxHeight="400px"
        />
      )}
    </div>
  );
} 