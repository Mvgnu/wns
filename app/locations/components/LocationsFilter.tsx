'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, MapPin, Building, Route, Filter, DollarSign, Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface LocationsFilterProps {
  sportCounts: SportCount[];
  typeCounts: TypeCount[];
  detailTypeCounts: DetailTypeCount[];
  amenityCounts: AmenityCount[];
  selectedSports: string[];
  selectedType: string;
  selectedDetailType: string;
  selectedAmenities: string[];
  allSports: Array<{ value: string; label: string }>;
}

export default function LocationsFilter({
  sportCounts,
  typeCounts,
  detailTypeCounts,
  amenityCounts,
  selectedSports,
  selectedType,
  selectedDetailType,
  selectedAmenities,
  allSports,
}: LocationsFilterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedSports);
  const [typeFilter, setTypeFilter] = useState<string>(selectedType);
  const [detailTypeFilter, setDetailTypeFilter] = useState<string>(selectedDetailType);
  const [amenityFilters, setAmenityFilters] = useState<string[]>(selectedAmenities);
  
  // Effect to update selection when props change
  useEffect(() => {
    if (selectedSports.length > 0 && JSON.stringify(selectedSports) !== JSON.stringify(selected)) {
      setSelected(selectedSports);
    }
    if (selectedType !== typeFilter) {
      setTypeFilter(selectedType);
    }
    if (selectedDetailType !== detailTypeFilter) {
      setDetailTypeFilter(selectedDetailType);
    }
    if (selectedAmenities.length > 0 && JSON.stringify(selectedAmenities) !== JSON.stringify(amenityFilters)) {
      setAmenityFilters(selectedAmenities);
    }
  }, [selectedSports, selectedType, selectedDetailType, selectedAmenities, selected, typeFilter, detailTypeFilter, amenityFilters]);

  // Update URL with all active filters
  const updateUrlWithFilters = (
    sports: string[], 
    type: string,
    detailType: string,
    amenities: string[]
  ) => {
    let url = '/locations';
    const params = new URLSearchParams();
    
    if (sports.length > 0) {
      params.set('sports', sports.join(','));
    }
    
    if (type && type !== 'all') {
      params.set('type', type);
    }

    if (detailType && detailType !== 'all') {
      params.set('detailType', detailType);
    }

    if (amenities.length > 0) {
      params.set('amenities', amenities.join(','));
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    router.push(url);
  };

  // Handle filter changes
  const handleSportsSelectionChange = (sport: string) => {
    const newSelected = selected.includes(sport)
      ? selected.filter(s => s !== sport)
      : [...selected, sport];
    setSelected(newSelected);
    updateUrlWithFilters(newSelected, typeFilter, detailTypeFilter, amenityFilters);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    updateUrlWithFilters(selected, value, detailTypeFilter, amenityFilters);
  };

  const handleDetailTypeChange = (value: string) => {
    setDetailTypeFilter(value);
    updateUrlWithFilters(selected, typeFilter, value, amenityFilters);
  };

  const handleAmenityChange = (amenity: string) => {
    const newAmenities = amenityFilters.includes(amenity)
      ? amenityFilters.filter(a => a !== amenity)
      : [...amenityFilters, amenity];
    setAmenityFilters(newAmenities);
    updateUrlWithFilters(selected, typeFilter, detailTypeFilter, newAmenities);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelected([]);
    setTypeFilter('all');
    setDetailTypeFilter('all');
    setAmenityFilters([]);
    router.push('/locations');
  };

  // Determine if we should show the clear filter button
  const hasFilters = selected.length > 0 || 
                    (typeFilter && typeFilter !== 'all') || 
                    (detailTypeFilter && detailTypeFilter !== 'all') || 
                    amenityFilters.length > 0;

  return (
    <div className="space-y-6">
      {/* Sports filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Sportarten</h3>
        <div className="flex flex-wrap gap-2">
          {sportCounts.map((sport) => (
            <button
              key={sport.sport}
              onClick={() => handleSportsSelectionChange(sport.sport)}
              className={cn(
                "inline-flex items-center text-sm px-3 py-1 rounded-full transition-colors",
                selected.includes(sport.sport)
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {allSports.find(s => s.value === sport.sport)?.label || sport.sport}
              <span className="ml-1 text-xs">({sport._count.id})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Place type filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Art des Ortes</h3>
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Art des Ortes">
              {typeFilter === 'all' ? 'Alle Arten' : typeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Arten</SelectItem>
            {typeCounts.map(type => (
              <SelectItem key={type.placeType} value={type.placeType}>
                {type.placeType} ({type._count.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detail type filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Spezifischer Typ</h3>
        <Select value={detailTypeFilter} onValueChange={handleDetailTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Spezifischer Typ">
              {detailTypeFilter === 'all' ? 'Alle Typen' : detailTypeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {detailTypeCounts.map(type => (
              <SelectItem key={type.detailType} value={type.detailType}>
                {type.detailType} ({type._count.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amenities filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Ausstattung</h3>
        <div className="space-y-2">
          {amenityCounts.map(amenity => (
            <div key={amenity.type} className="flex items-center space-x-2">
              <Switch
                id={`amenity-${amenity.type}`}
                checked={amenityFilters.includes(amenity.type)}
                onCheckedChange={() => handleAmenityChange(amenity.type)}
              />
              <Label htmlFor={`amenity-${amenity.type}`}>
                {amenity.type} ({amenity._count.id})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset filters button */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetAllFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Filter zurücksetzen
        </Button>
      )}

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {selected.map((sport) => (
            <Badge key={sport} variant="secondary" className="gap-1">
              {allSports.find(s => s.value === sport)?.label || sport}
              <button
                onClick={() => handleSportsSelectionChange(sport)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {typeFilter && typeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Building className="h-3 w-3" />
              {typeFilter}
              <button
                onClick={() => handleTypeChange('all')}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {detailTypeFilter && detailTypeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Route className="h-3 w-3" />
              {detailTypeFilter}
              <button
                onClick={() => handleDetailTypeChange('all')}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {amenityFilters.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {amenity}
              <button
                onClick={() => handleAmenityChange(amenity)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 