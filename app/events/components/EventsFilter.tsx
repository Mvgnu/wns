'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HierarchicalFilter, HierarchicalOption } from '@/components/ui/hierarchical-filter';
import { allSports, getSportsByCategory, sportsCategories } from '@/lib/sportsData';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, DollarSign, Lock, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  currentFilters?: {
    isPaid?: boolean;
    joinRestriction?: string;
    isRecurring?: boolean;
    priceRange?: string;
  };
}

export default function EventsFilter({ 
  sports, 
  selectedSports,
  currentSport,
  currentTimeframe,
  currentFilters = {}
}: EventsFilterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedSports);
  const [timeFilter, setTimeFilter] = useState<string>(currentTimeframe || '');
  const [showPaidOnly, setShowPaidOnly] = useState<boolean>(currentFilters.isPaid || false);
  const [accessFilter, setAccessFilter] = useState<string>(currentFilters.joinRestriction || 'all');
  const [showRecurringOnly, setShowRecurringOnly] = useState<boolean>(currentFilters.isRecurring || false);
  const [priceRange, setPriceRange] = useState<string>(currentFilters.priceRange || 'all');
  
  // Effect to update selection when props change
  useEffect(() => {
    if (selectedSports.length > 0 && JSON.stringify(selectedSports) !== JSON.stringify(selected)) {
      setSelected(selectedSports);
    }
    if (currentTimeframe !== timeFilter) {
      setTimeFilter(currentTimeframe || '');
    }
    if (currentFilters.isPaid !== showPaidOnly) {
      setShowPaidOnly(currentFilters.isPaid || false);
    }
    if (currentFilters.joinRestriction !== accessFilter) {
      setAccessFilter(currentFilters.joinRestriction || 'all');
    }
    if (currentFilters.isRecurring !== showRecurringOnly) {
      setShowRecurringOnly(currentFilters.isRecurring || false);
    }
    if (currentFilters.priceRange !== priceRange) {
      setPriceRange(currentFilters.priceRange || 'all');
    }
  }, [selectedSports, currentTimeframe, currentFilters, selected, timeFilter, showPaidOnly, accessFilter, showRecurringOnly, priceRange]);

  // Build hierarchical options from sports data
  const sportsByCategory = getSportsByCategory();
  
  const hierarchicalOptions: HierarchicalOption[] = sportsCategories.map(category => ({
    id: category,
    label: category,
    value: category,
    children: sportsByCategory[category]
      .filter(sport => sports.some(s => s.value === sport.value))
      .map(sport => {
        const sportWithCount = sports.find(s => s.value === sport.value);
        return {
          id: sport.value,
          label: `${sport.label} (${sportWithCount?.count || 0})`,
          value: sport.value,
          parent: category
        };
      })
  })).filter(option => option.children && option.children.length > 0);

  // Update URL with all active filters
  const updateUrlWithFilters = (
    sports: string[], 
    timeframe: string,
    isPaid: boolean,
    joinRestriction: string,
    isRecurring: boolean,
    priceRangeValue: string
  ) => {
    let url = '/events';
    const params = new URLSearchParams();
    
    if (sports.length > 0) {
      params.set('sports', sports.join(','));
    }
    
    if (timeframe) {
      params.set('timeframe', timeframe);
    }

    if (isPaid) {
      params.set('isPaid', 'true');
    }

    if (joinRestriction && joinRestriction !== 'all') {
      params.set('joinRestriction', joinRestriction);
    }

    if (isRecurring) {
      params.set('isRecurring', 'true');
    }

    if (priceRangeValue && priceRangeValue !== 'all') {
      params.set('priceRange', priceRangeValue);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    router.push(url);
  };

  // Handle filter changes
  const handleSportsSelectionChange = (values: string[]) => {
    setSelected(values);
    updateUrlWithFilters(values, timeFilter, showPaidOnly, accessFilter, showRecurringOnly, priceRange);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setTimeFilter(timeframe);
    updateUrlWithFilters(selected, timeframe, showPaidOnly, accessFilter, showRecurringOnly, priceRange);
  };

  const handlePaidFilterChange = (checked: boolean) => {
    setShowPaidOnly(checked);
    updateUrlWithFilters(selected, timeFilter, checked, accessFilter, showRecurringOnly, priceRange);
  };

  const handleAccessFilterChange = (value: string) => {
    setAccessFilter(value);
    updateUrlWithFilters(selected, timeFilter, showPaidOnly, value, showRecurringOnly, priceRange);
  };

  const handleRecurringFilterChange = (checked: boolean) => {
    setShowRecurringOnly(checked);
    updateUrlWithFilters(selected, timeFilter, showPaidOnly, accessFilter, checked, priceRange);
  };

  const handlePriceRangeChange = (value: string) => {
    setPriceRange(value);
    updateUrlWithFilters(selected, timeFilter, showPaidOnly, accessFilter, showRecurringOnly, value);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelected([]);
    setTimeFilter('');
    setShowPaidOnly(false);
    setAccessFilter('all');
    setShowRecurringOnly(false);
    setPriceRange('all');
    router.push('/events');
  };

  // Determine if we should show the clear filter button
  const hasFilters = selected.length > 0 || 
                    timeFilter || 
                    showPaidOnly || 
                    (accessFilter && accessFilter !== 'all') || 
                    showRecurringOnly || 
                    (priceRange && priceRange !== 'all');

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
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Sportarten</h3>
        <HierarchicalFilter
          options={hierarchicalOptions}
          selected={selected}
          onChange={handleSportsSelectionChange}
        />
      </div>

      {/* Time filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Zeitraum</h3>
        <div className="flex flex-wrap gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={timeFilter === tf.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeframeChange(tf.value)}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Price filters */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 mb-3">Preis</h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="paid-filter"
            checked={showPaidOnly}
            onCheckedChange={handlePaidFilterChange}
          />
          <Label htmlFor="paid-filter">Nur kostenpflichtige Events</Label>
        </div>

        <Select value={priceRange} onValueChange={handlePriceRangeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Preisbereich">
              {priceRange === 'all' ? 'Alle Preise' : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Preise</SelectItem>
            <SelectItem value="0-10">Bis 10€</SelectItem>
            <SelectItem value="10-25">10€ - 25€</SelectItem>
            <SelectItem value="25-50">25€ - 50€</SelectItem>
            <SelectItem value="50+">Über 50€</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Access filter */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Zugang</h3>
        <Select value={accessFilter} onValueChange={handleAccessFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Zugangsbeschränkung">
              {accessFilter === 'all' ? 'Alle Events' : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Events</SelectItem>
            <SelectItem value="everyone">Öffentliche Events</SelectItem>
            <SelectItem value="groupOnly">Nur Gruppenevents</SelectItem>
            <SelectItem value="inviteOnly">Nur mit Einladung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recurring events filter */}
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring-filter"
          checked={showRecurringOnly}
          onCheckedChange={handleRecurringFilterChange}
        />
        <Label htmlFor="recurring-filter">Nur wiederkehrende Events</Label>
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
                onClick={() => handleSportsSelectionChange(selected.filter(s => s !== sport))}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {timeFilter && (
            <Badge variant="secondary" className="gap-1">
              {timeframes.find(tf => tf.value === timeFilter)?.label}
              <button
                onClick={() => handleTimeframeChange('')}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {showPaidOnly && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              Kostenpflichtig
              <button
                onClick={() => handlePaidFilterChange(false)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {accessFilter && accessFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              {accessFilter === 'everyone' ? 'Öffentlich' : 
               accessFilter === 'groupOnly' ? 'Nur Gruppe' : 
               'Nur mit Einladung'}
              <button
                onClick={() => handleAccessFilterChange('all')}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {showRecurringOnly && (
            <Badge variant="secondary" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Wiederkehrend
              <button
                onClick={() => handleRecurringFilterChange(false)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priceRange && priceRange !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {priceRange === '0-10' ? 'Bis 10€' :
               priceRange === '10-25' ? '10€ - 25€' :
               priceRange === '25-50' ? '25€ - 50€' :
               'Über 50€'}
              <button
                onClick={() => handlePriceRangeChange('all')}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
} 