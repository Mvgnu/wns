'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface HierarchicalOption {
  id: string;
  label: string;
  value: string;
  parent?: string;
  children?: HierarchicalOption[];
}

interface HierarchicalFilterProps {
  options: HierarchicalOption[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function HierarchicalFilter({
  options,
  selected,
  onChange,
  placeholder = 'Auswählen...',
}: HierarchicalFilterProps) {
  const [open, setOpen] = React.useState(false);

  // Flattened list of all options for search functionality
  const allOptions = React.useMemo(() => {
    const result: HierarchicalOption[] = [];
    
    // Add parent options
    options.forEach(option => {
      result.push(option);
      // Add child options if they exist
      if (option.children) {
        option.children.forEach(child => {
          result.push(child);
        });
      }
    });
    
    return result;
  }, [options]);
  
  // Function to toggle a value in the selected array
  const toggleValue = React.useCallback((value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }, [selected, onChange]);
  
  // Get display names for selected values
  const selectedLabels = selected.map(value => {
    const option = allOptions.find(opt => opt.value === value);
    return option?.label || value;
  });

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length > 0
              ? `${selected.length} ausgewählt`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Suchen..." />
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
            <CommandList>
              <ScrollArea className="h-72">
                {options.map(category => (
                  <React.Fragment key={category.id}>
                    <CommandGroup heading={category.label}>
                      {/* Category item */}
                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                        <div 
                          className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border cursor-pointer ${
                            selected.includes(category.value) ? 'bg-primary border-primary' : 'opacity-50'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleValue(category.value);
                          }}
                        >
                          {selected.includes(category.value) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span 
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleValue(category.value);
                          }}
                        >
                          {category.label}
                        </span>
                      </div>
                      
                      {/* Child items */}
                      {category.children?.map(item => (
                        <div key={item.value} className="pl-8 flex items-center gap-2 px-2 py-1.5 text-sm">
                          <div 
                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border cursor-pointer ${
                              selected.includes(item.value) ? 'bg-primary border-primary' : 'opacity-50'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleValue(item.value);
                            }}
                          >
                            {selected.includes(item.value) && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleValue(item.value);
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </CommandGroup>
                  </React.Fragment>
                ))}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected items as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label, i) => (
            <Badge 
              key={i} 
              variant="secondary"
              className="flex items-center gap-1"
            >
              {label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  toggleValue(selected[i]);
                }}
              >
                <span className="sr-only">Entfernen</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </Badge>
          ))}
          {selected.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 px-2 text-xs"
              onClick={() => onChange([])}
            >
              Alle löschen
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 