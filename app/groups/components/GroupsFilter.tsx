'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

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

export default function GroupsFilter({ sports, selectedSports, currentSport }: GroupsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedSports, setExpandedSports] = useState(true);
  const [localSelectedSports, setLocalSelectedSports] = useState<string[]>(selectedSports || []);
  
  useEffect(() => {
    setLocalSelectedSports(selectedSports || []);
  }, [selectedSports]);
  
  const toggleSport = (sport: string) => {
    let newSelectedSports: string[];
    
    if (localSelectedSports.includes(sport)) {
      newSelectedSports = localSelectedSports.filter(s => s !== sport);
    } else {
      newSelectedSports = [...localSelectedSports, sport];
    }
    
    setLocalSelectedSports(newSelectedSports);
    
    const params = new URLSearchParams(searchParams.toString());
    
    // If there are selected sports, add them to the URL
    if (newSelectedSports.length > 0) {
      params.set("sports", newSelectedSports.join(","));
    } else {
      params.delete("sports");
    }
    
    // Remove any single sport filter if we're using the multi-select
    params.delete("sport");
    
    router.push(`/groups?${params.toString()}`);
  };
  
  // Sort sports by count (descending) and then alphabetically
  const sortedSports = [...sports].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
  
  // Only show sports with groups
  const availableSports = sortedSports.filter(sport => sport.count > 0);
  
  return (
    <div className="space-y-4">
      {/* Sports filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Sportarten</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setExpandedSports(!expandedSports)}
          >
            {expandedSports ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expandedSports && (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {availableSports.length > 0 ? (
              availableSports.map(sport => (
                <div key={sport.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`sport-${sport.value}`}
                    checked={localSelectedSports.includes(sport.value)}
                    onCheckedChange={() => toggleSport(sport.value)}
                    className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <label
                    htmlFor={`sport-${sport.value}`}
                    className="text-sm text-gray-700 flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>{sport.label}</span>
                    <Badge variant="outline" className="bg-white text-gray-500 ml-2 font-normal">
                      {sport.count}
                    </Badge>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Keine Sportarten verfügbar</p>
            )}
          </div>
        )}
        
        {currentSport && !localSelectedSports.includes(currentSport) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Aktiver Filter:</p>
            <div className="flex items-center gap-2">
              <Link
                href="/groups"
                className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 rounded-full py-1 px-3 hover:bg-indigo-100"
              >
                {sports.find(s => s.value === currentSport)?.label || currentSport}
                <span className="ml-1">×</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 