"use client";

import * as React from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface CustomDatePickerProps {
  selectedDates: Date[];
  onDateSelect: (dates: Date[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  allowMultiple?: boolean;
}

export function CustomDatePicker({
  selectedDates,
  onDateSelect,
  open,
  onOpenChange,
  title = "Datum auswählen",
  allowMultiple = true,
}: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // Get days in current month
  const daysInMonth = React.useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  // Get day names
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  
  // Calculate the offset for the first day of the month (0 = Monday, 6 = Sunday)
  const firstDayOffset = (startOfMonth(currentMonth).getDay() + 6) % 7;
  
  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (allowMultiple) {
      // Check if date is already selected
      const isSelected = selectedDates.some(selectedDate => 
        isSameDay(selectedDate, date)
      );
      
      if (isSelected) {
        // Remove date if already selected
        onDateSelect(selectedDates.filter(selectedDate => 
          !isSameDay(selectedDate, date)
        ));
      } else {
        // Add date if not selected
        onDateSelect([...selectedDates, date]);
      }
    } else {
      // Single selection mode
      onDateSelect([date]);
    }
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day names */}
            {dayNames.map((day, index) => (
              <div key={index} className="text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9" />
            ))}
            
            {/* Days of month */}
            {daysInMonth.map((day, index) => {
              const isSelected = selectedDates.some(selectedDate => 
                isSameDay(selectedDate, day)
              );
              
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 p-0 font-normal",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <time dateTime={format(day, 'yyyy-MM-dd')}>
                    {format(day, 'd')}
                  </time>
                </Button>
              );
            })}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 