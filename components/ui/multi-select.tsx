"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

export type OptionType = {
  label: string;
  value: string;
  group?: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  groupedOptions?: boolean;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Auswählen...",
  className,
  groupedOptions,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const ignoreCloseRef = React.useRef(false); // Ref to prevent closing on selection

  // Ensure selected is always an array even if passed as undefined
  const safeSelected = React.useMemo(() => {
    return Array.isArray(selected) ? selected : [];
  }, [selected]);

  // Group options by their group property
  const groupedOptionsList = React.useMemo(() => {
    if (!groupedOptions) return {};

    return options.reduce<Record<string, OptionType[]>>((acc, option) => {
      const group = option.group || "Andere";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(option);
      return acc;
    }, {});
  }, [options, groupedOptions]);

  // Get the labels of selected options for display
  const selectedLabels = React.useMemo(() =>
    safeSelected.map((value) => {
      const option = options.find((opt) => opt.value === value);
      return option?.label || value;
    }),
  [safeSelected, options]);

  // Handle removing an option by its value
  const handleRemove = (value: string) => {
    onChange(safeSelected.filter((item) => item !== value));
  };

  // Handle unselect all
  const handleUnselectAll = () => {
    onChange([]);
    setInputValue(""); // Clear search after deselection
  };

  // Handle selecting an option by toggling its presence
  const handleSelect = React.useCallback((value: string) => {
    // Set the flag to prevent closing
    ignoreCloseRef.current = true;
    
    // Create a new array to avoid reference issues
    let newSelected = [...safeSelected];
    
    if (safeSelected.includes(value)) {
      // Remove the value if it's already selected
      newSelected = newSelected.filter((item) => item !== value);
    } else {
      // Add the value if it's not already selected
      newSelected.push(value);
    }
    
    // Trigger the onChange with the new array
    onChange(newSelected);
    setInputValue(""); // Clear search after selection
    
    // Return false to prevent the CommandItem from closing the popover
    return false;
  }, [safeSelected, onChange]);

  // Handle popover state changes
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return;
    
    if (!newOpen && ignoreCloseRef.current) {
      // If we're trying to close but the flag is set, ignore this close event
      ignoreCloseRef.current = false;
      return;
    }
    
    setOpen(newOpen);
    
    // Reset the flag when we intentionally close
    if (!newOpen) {
      ignoreCloseRef.current = false;
    }
  };

  // Filter options based on search input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    const lowerCaseInput = inputValue.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerCaseInput) ||
        (option.group && option.group.toLowerCase().includes(lowerCaseInput))
    );
  }, [options, inputValue]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("min-h-[2.5rem] h-auto w-full justify-between", className)}
          disabled={disabled}
          onClick={() => setOpen(true)} // Ensure clicking the button opens the popover
        >
          <div className="flex flex-wrap gap-1 items-center">
            {safeSelected.length > 0 ? (
              safeSelected.length > 3 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {safeSelected.length} ausgewählt
                </Badge>
              ) : (
                selectedLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
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
          <CommandList>
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
            {safeSelected.length > 0 && (
              <>
                <div className="p-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnselectAll();
                    }}
                  >
                    Alle löschen
                  </Button>
                </div>
                <CommandSeparator />
              </>
            )}
            <ScrollArea className="h-[300px]">
              {groupedOptions ? (
                Object.entries(groupedOptionsList).map(([group, groupOptions]) => {
                  const filteredGroupOptions = inputValue
                    ? groupOptions.filter(
                        (option) =>
                          option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                          (option.group &&
                            option.group.toLowerCase().includes(inputValue.toLowerCase()))
                      )
                    : groupOptions;
                  if (filteredGroupOptions.length === 0) return null;
                  return (
                    <CommandGroup key={group} heading={group}>
                      {filteredGroupOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelect(option.value);
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              safeSelected.includes(option.value)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50"
                            )}
                          >
                            {safeSelected.includes(option.value) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </CommandGroup>
                  );
                })
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          safeSelected.includes(option.value)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {safeSelected.includes(option.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}