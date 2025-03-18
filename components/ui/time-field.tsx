"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TimeValue {
  hours?: number;
  minutes?: number;
}

interface TimeFieldProps {
  value?: TimeValue;
  onChange?: (value: TimeValue) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeField({
  value = { hours: 0, minutes: 0 },
  onChange,
  className,
  disabled = false,
}: TimeFieldProps) {
  const hours = value?.hours || 0;
  const minutes = value?.minutes || 0;

  const handleHoursChange = (newHours: string) => {
    const hoursNum = parseInt(newHours, 10);
    if (!isNaN(hoursNum) && hoursNum >= 0 && hoursNum <= 23) {
      onChange?.({ ...value, hours: hoursNum });
    }
  };

  const handleMinutesChange = (newMinutes: string) => {
    const minutesNum = parseInt(newMinutes, 10);
    if (!isNaN(minutesNum) && minutesNum >= 0 && minutesNum <= 59) {
      onChange?.({ ...value, minutes: minutesNum });
    }
  };

  const incrementHours = () => {
    const newHours = (hours + 1) % 24;
    onChange?.({ ...value, hours: newHours });
  };

  const decrementHours = () => {
    const newHours = (hours - 1 + 24) % 24;
    onChange?.({ ...value, hours: newHours });
  };

  const incrementMinutes = () => {
    const newMinutes = (minutes + 5) % 60;
    onChange?.({ ...value, minutes: newMinutes });
  };

  const decrementMinutes = () => {
    const newMinutes = (minutes - 5 + 60) % 60;
    onChange?.({ ...value, minutes: newMinutes });
  };

  // Format numbers to always have 2 digits
  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={incrementHours}
          disabled={disabled}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Select
            value={hours.toString()}
            onValueChange={handleHoursChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[70px] h-10">
              <SelectValue placeholder={formatNumber(hours)} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {formatNumber(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={decrementHours}
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <span className="text-lg font-semibold">:</span>

      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={incrementMinutes}
          disabled={disabled}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Select
            value={minutes.toString()}
            onValueChange={handleMinutesChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[70px] h-10">
              <SelectValue placeholder={formatNumber(minutes)} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i * 5).map((min) => (
                <SelectItem key={min} value={min.toString()}>
                  {formatNumber(min)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={decrementMinutes}
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 