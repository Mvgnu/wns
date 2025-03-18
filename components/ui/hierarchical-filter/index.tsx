"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type HierarchicalOption = {
  id: string;
  label: string;
  value: string;
  children?: HierarchicalOption[];
  parent?: string;
};

interface HierarchicalFilterProps {
  options: HierarchicalOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
}

export function HierarchicalFilter({
  options,
  selected,
  onChange,
  placeholder = "Filter auswählen...",
  className,
  disabled = false,
  maxHeight = "350px",
}: HierarchicalFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  // Ensure selected is always an array
  const safeSelected = React.useMemo(() => {
    return Array.isArray(selected) ? selected : [];
  }, [selected]);

  // Get all possible values including children
  const allPossibleValues = React.useMemo(() => {
    const values: string[] = [];
    
    const addValues = (options: HierarchicalOption[]) => {
      options.forEach(option => {
        values.push(option.value);
        if (option.children && option.children.length > 0) {
          addValues(option.children);
        }
      });
    };
    
    addValues(options);
    return values;
  }, [options]);

  // Get labels for selected options
  const selectedLabels = React.useMemo(() => {
    const labels: string[] = [];
    
    const findLabel = (options: HierarchicalOption[], value: string): boolean => {
      for (const option of options) {
        if (option.value === value) {
          labels.push(option.label);
          return true;
        }
        if (option.children && option.children.length > 0) {
          const found = findLabel(option.children, value);
          if (found) return true;
        }
      }
      return false;
    };
    
    safeSelected.forEach(value => {
      if (!findLabel(options, value)) {
        // Fall back to value if label not found
        labels.push(value);
      }
    });
    
    return labels;
  }, [options, safeSelected]);

  // Toggle expand/collapse of a group
  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Checks if a parent has all children selected
  const hasAllChildrenSelected = (option: HierarchicalOption): boolean => {
    if (!option.children || option.children.length === 0) return false;
    
    return option.children.every(child => {
      if (safeSelected.includes(child.value)) {
        return true;
      }
      if (child.children && child.children.length > 0) {
        return hasAllChildrenSelected(child);
      }
      return false;
    });
  };

  // Checks if a parent has some but not all children selected
  const hasSomeChildrenSelected = (option: HierarchicalOption): boolean => {
    if (!option.children || option.children.length === 0) return false;
    
    return option.children.some(child => {
      if (safeSelected.includes(child.value)) {
        return true;
      }
      if (child.children && child.children.length > 0) {
        return hasSomeChildrenSelected(child);
      }
      return false;
    });
  };

  // Get all descendant values of an option
  const getAllDescendantValues = (option: HierarchicalOption): string[] => {
    const values: string[] = [];
    
    const addDescendants = (opt: HierarchicalOption) => {
      values.push(opt.value);
      if (opt.children && opt.children.length > 0) {
        opt.children.forEach(addDescendants);
      }
    };
    
    if (option.children && option.children.length > 0) {
      option.children.forEach(addDescendants);
    }
    
    return values;
  };

  // Handle selecting an option
  const handleSelect = (option: HierarchicalOption) => {
    let newSelected = [...safeSelected];
    
    if (safeSelected.includes(option.value)) {
      // Deselect this option and all its children
      const descendantValues = getAllDescendantValues(option);
      newSelected = newSelected.filter(value => 
        value !== option.value && !descendantValues.includes(value)
      );
    } else {
      // Select this option and all its children
      newSelected.push(option.value);
      const descendantValues = getAllDescendantValues(option);
      descendantValues.forEach(value => {
        if (!newSelected.includes(value)) {
          newSelected.push(value);
        }
      });
    }
    
    onChange(newSelected);
  };

  // Handle clearing all selections
  const handleClearAll = () => {
    onChange([]);
  };

  // Render a single option with its children
  const renderOption = (option: HierarchicalOption, level = 0) => {
    const isExpanded = !!expandedGroups[option.id];
    const hasChildren = option.children && option.children.length > 0;
    const isSelected = safeSelected.includes(option.value);
    const allChildrenSelected = hasAllChildrenSelected(option);
    const someChildrenSelected = hasSomeChildrenSelected(option);
    
    const checkboxState = isSelected 
      ? "checked" 
      : allChildrenSelected 
        ? "checked" 
        : someChildrenSelected 
          ? "indeterminate" 
          : "unchecked";
          
    const matchesSearch = !inputValue || 
      option.label.toLowerCase().includes(inputValue.toLowerCase());
    
    // Check if any children match the search
    const childrenMatchSearch = hasChildren &&
      option.children!.some(child => 
        child.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    
    // Hide if not matching search and no children match
    if (inputValue && !matchesSearch && !childrenMatchSearch) {
      return null;
    }
    
    return (
      <React.Fragment key={option.id}>
        <CommandItem
          value={option.value}
          onSelect={() => handleSelect(option)}
          className={cn("flex items-center", level > 0 && `pl-${level * 4 + 2}`)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(option.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <div className={cn(
            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
            checkboxState === "checked" && "bg-primary text-primary-foreground",
            checkboxState === "indeterminate" && "bg-primary/50 text-primary-foreground",
            checkboxState === "unchecked" && "opacity-50"
          )}>
            {checkboxState === "checked" && <Check className="h-3 w-3" />}
            {checkboxState === "indeterminate" && <div className="h-2 w-2 bg-primary-foreground rounded-sm" />}
          </div>
          <span>{option.label}</span>
        </CommandItem>
        
        {hasChildren && isExpanded && option.children!.map(child => 
          renderOption(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("min-h-[2.5rem] h-auto w-full justify-between", className)}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {safeSelected.length > 0 ? (
              safeSelected.length > 3 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {safeSelected.length} ausgewählt
                </Badge>
              ) : (
                selectedLabels.map(label => (
                  <Badge key={label} variant="secondary" className="rounded-sm px-1 font-normal">
                    {label}
                  </Badge>
                ))
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Suchen..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-[350px]" style={{ maxHeight: maxHeight }}>
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
            {safeSelected.length > 0 && (
              <>
                <div className="p-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={handleClearAll}
                  >
                    Alle löschen
                  </Button>
                </div>
                <CommandSeparator />
              </>
            )}
            <CommandGroup>
              {options.map(option => renderOption(option))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 