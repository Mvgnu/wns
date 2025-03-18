"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { de } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
  showTimePicker?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  label = "Datum und Uhrzeit auswählen",
  disabled = false,
  showTimePicker = true,
}: DateTimePickerProps) {
  // Create arrays for hours and minutes
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // Handle date change from calendar
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }

    // Preserve the time if a date is already set
    if (date) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      newDate.setHours(hours, minutes, 0, 0);
    } else {
      // Set default time to the current time
      const now = new Date();
      newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }

    setDate(newDate);
  };

  // Handle hour change
  const handleHourChange = (hour: string) => {
    if (!date) {
      // If no date is set, set it to today with the selected hour
      const newDate = new Date();
      newDate.setHours(parseInt(hour));
      newDate.setMinutes(0);
      setDate(newDate);
      return;
    }
    
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour));
    setDate(newDate);
  };

  // Handle minute change
  const handleMinuteChange = (minute: string) => {
    if (!date) {
      // If no date is set, set it to today with the selected minute
      const newDate = new Date();
      newDate.setMinutes(parseInt(minute));
      setDate(newDate);
      return;
    }
    
    const newDate = new Date(date);
    newDate.setMinutes(parseInt(minute));
    setDate(newDate);
  };

  // Format the date for display in German format
  const formattedDate = date 
    ? format(date, showTimePicker ? 'PPP, HH:mm' : 'PPP', { locale: de })
    : label;

  return (
    <div className="flex flex-col space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDate}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
            locale={de}
          />
          {showTimePicker && date && (
            <div className="border-t border-border p-3 space-y-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="text-sm font-medium">Zeit</div>
              </div>
              <div className="flex justify-between">
                <Select
                  value={date ? date.getHours().toString() : undefined}
                  onValueChange={handleHourChange}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Stunde" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")} Uhr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground self-center">:</span>
                <Select
                  value={date ? (Math.floor(date.getMinutes() / 5) * 5).toString() : undefined}
                  onValueChange={handleMinuteChange}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")} Min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
} 