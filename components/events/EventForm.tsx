"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploader from "@/components/ui/ImageUploader";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useLocations } from "@/hooks/useLocations";
import { useGroups } from "@/hooks/useGroups";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  TimeField,
  TimeValue
} from "@/components/ui/time-field";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein").max(100, "Titel darf maximal 100 Zeichen lang sein"),
  description: z.string().max(1000, "Beschreibung darf maximal 1000 Zeichen lang sein").optional(),
  startTime: z.string().min(1, "Startzeit ist erforderlich"),
  endTime: z.string().optional(),
  locationId: z.string().optional().refine(val => !val || val !== "none", { message: "" }),
  groupId: z.string().optional().refine(val => !val || val !== "none", { message: "" }),
  image: z.string().optional(),
  // Fields for event type and recurring events
  eventType: z.enum(["once", "recurring"]).default("once"),
  // Recurring event fields
  recurringPattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurringDays: z.array(z.number()).optional(),
  recurringEndDate: z.string().optional(),
  // New field for monthly recurrence type
  monthlyRecurrenceType: z.enum(["byDate", "byWeekday"]).default("byDate").optional(),
  // For "byWeekday" option: which occurrence (1st, 2nd, 3rd, 4th)
  monthlyWeekdayOccurrence: z.enum(["1", "2", "3", "4"]).optional(),
  // For "byWeekday" option: which day of week
  monthlyWeekdayDay: z.enum(["0", "1", "2", "3", "4", "5", "6"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Days of the week for recurring events
const daysOfWeek = [
  { id: 0, label: "Sonntag" },
  { id: 1, label: "Montag" },
  { id: 2, label: "Dienstag" },
  { id: 3, label: "Mittwoch" },
  { id: 4, label: "Donnerstag" },
  { id: 5, label: "Freitag" },
  { id: 6, label: "Samstag" },
];

// Days of the month for recurring events
const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({ id: i + 1, label: `${i + 1}` }));

interface EventFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    locationId?: string;
    groupId?: string;
    image?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    recurringDays?: number[];
    recurringEndDate?: string;
  };
  isEditing?: boolean;
  groups?: Array<{
    id: string;
    name: string;
    isPrivate?: boolean;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    address?: string | null;
    sport?: string;
  }>;
  preselectedGroupId?: string;
  preselectedLocationId?: string;
}

export default function EventForm({ 
  initialData, 
  isEditing = false,
  groups: propGroups,
  locations: propLocations,
  preselectedGroupId,
  preselectedLocationId
}: EventFormProps) {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: fetchedLocations } = useLocations();
  const { data: fetchedGroups } = useGroups();
  const [images, setImages] = useState<string[]>(initialData?.image ? [initialData.image] : []);
  
  // State for dates
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startTime ? new Date(initialData.startTime) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endTime ? new Date(initialData.endTime) : undefined
  );
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>(
    initialData?.recurringEndDate ? new Date(initialData.recurringEndDate) : undefined
  );
  
  // Date-time picker dialogs
  const [startTimeDialogOpen, setStartTimeDialogOpen] = useState(false);
  const [endTimeDialogOpen, setEndTimeDialogOpen] = useState(false);
  const [datePickerStage, setDatePickerStage] = useState<'date' | 'time'>('date');
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(undefined);
  const [tempSelectedTime, setTempSelectedTime] = useState<TimeValue | undefined>(undefined);
  const [currentDialog, setCurrentDialog] = useState<'start' | 'end'>('start');
  
  // Determine event type from initial data
  const initialEventType = initialData?.isRecurring ? "recurring" : "once";
  
  // Default to empty array if no recurring days
  const initialRecurringDays = initialData?.recurringDays || [];
  
  // Use available groups
  const groups = propGroups || fetchedGroups || [];
  const locations = propLocations || fetchedLocations || [];
  
  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startTime: initialData?.startTime || "",
      endTime: initialData?.endTime || "",
      locationId: preselectedLocationId || initialData?.locationId || "none",
      groupId: preselectedGroupId || initialData?.groupId || "none",
      image: initialData?.image || "",
      eventType: initialEventType,
      recurringPattern: initialData?.recurringPattern as any || "weekly",
      recurringDays: initialRecurringDays,
      recurringEndDate: initialData?.recurringEndDate || "",
    },
  });
  
  // Get values and methods from form
  const { watch, setValue } = form;
  const eventType = watch("eventType");
  const recurringPattern = watch("recurringPattern");
  
  // Update start and end time in form when date changes
  useEffect(() => {
    if (startDate) {
      setValue("startTime", startDate.toISOString());
    }
    if (endDate) {
      setValue("endTime", endDate.toISOString());
    }
    if (recurringEndDate) {
      setValue("recurringEndDate", recurringEndDate.toISOString());
    }
  }, [startDate, endDate, recurringEndDate, setValue]);

  // Open date-time picker dialog
  const openDateTimePicker = (type: 'start' | 'end') => {
    setCurrentDialog(type);
    setDatePickerStage('date');
    setTempSelectedDate(type === 'start' ? startDate : endDate);
    setTempSelectedTime(undefined);
    if (type === 'start') {
      setStartTimeDialogOpen(true);
    } else {
      setEndTimeDialogOpen(true);
    }
  };

  // Handle date selection in dialog
  const handleDateSelection = (date: Date | undefined) => {
    setTempSelectedDate(date);
  };

  // Handle time selection in dialog
  const handleTimeSelection = (time: TimeValue | undefined) => {
    setTempSelectedTime(time);
  };

  // Combine date and time and close dialog
  const confirmDateTime = () => {
    if (datePickerStage === 'date' && tempSelectedDate) {
      // Move to time selection
      setDatePickerStage('time');
      return;
    }
    
    if (tempSelectedDate && tempSelectedTime) {
      const hours = tempSelectedTime.hours || 0;
      const minutes = tempSelectedTime.minutes || 0;
      
      const combinedDateTime = new Date(tempSelectedDate);
      combinedDateTime.setHours(hours, minutes, 0, 0);
      
      if (currentDialog === 'start') {
        setStartDate(combinedDateTime);
        setStartTimeDialogOpen(false);
      } else {
        setEndDate(combinedDateTime);
        setEndTimeDialogOpen(false);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Add the image from the state if available
      if (images.length > 0) {
        // Always use the first image from the images array
        values.image = images[0];
        console.log("Setting image URL:", values.image);
      } else {
        // Make sure image is undefined, not an empty string
        values.image = undefined;
      }
      
      // Process recurring event data
      const isRecurring = values.eventType === "recurring";
      
      // For recurring events, ensure we have the necessary data
      if (isRecurring) {
        if (!values.recurringPattern) {
          // Default to weekly if not specified
          values.recurringPattern = "weekly";
        }
        
        // Ensure recurring days is an array
        if (!values.recurringDays || !Array.isArray(values.recurringDays)) {
          values.recurringDays = [];
        }

        // For recurring events, we don't use the startTime/endTime as individual event times
        // but rather as the time of day for each recurring instance
        if (startDate) {
          // Create a template time for recurring events (just use the time part)
          const hours = startDate.getHours();
          const minutes = startDate.getMinutes();
          
          // Create a new date object for today with the same time
          const templateDate = new Date();
          templateDate.setHours(hours, minutes, 0, 0);
          values.startTime = templateDate.toISOString();
        }
        
        if (endDate) {
          const hours = endDate.getHours();
          const minutes = endDate.getMinutes();
          
          const templateDate = new Date();
          templateDate.setHours(hours, minutes, 0, 0);
          values.endTime = templateDate.toISOString();
        }

        // Make sure the recurring end date is set if available
        if (recurringEndDate) {
          values.recurringEndDate = recurringEndDate.toISOString();
        }
      } else {
        // For one-time events, use the specific dates selected
        // These should already be set correctly from the date picker
        if (startDate) {
          values.startTime = startDate.toISOString();
        }
        if (endDate) {
          values.endTime = endDate.toISOString();
        }
      }
      
      // Handle 'none' values for locationId and groupId
      if (values.locationId === "none") {
        values.locationId = undefined;
      }
      
      if (values.groupId === "none") {
        values.groupId = undefined;
      }
      
      // Prepare data for API
      const eventData = {
        ...values,
        isRecurring,
      };
      
      console.log("Creating event with data:", eventData);
      
      if (isEditing && initialData) {
        // Update existing event
        updateEvent.mutate({
          id: initialData.id,
          data: eventData,
        }, {
          onSuccess: () => {
            router.push(`/events/${initialData.id}`);
          },
          onError: (error) => {
            console.error("Error updating event:", error);
            toast({
              title: "Fehler",
              description: `Fehler beim Aktualisieren: ${error.message}`,
              variant: "destructive",
            });
          }
        });
      } else {
        // Create new event
        createEvent.mutate(eventData as any, {
          onSuccess: (newEvent) => {
            // Ensure we have a valid ID before redirecting
            if (newEvent && newEvent.id) {
              router.push(`/events/${newEvent.id}`);
            } else {
              console.error("Missing event ID in response:", newEvent);
              toast({
                title: "Hinweis",
                description: "Das Event wurde erstellt, aber die Weiterleitung ist fehlgeschlagen",
                variant: "default",
              });
              router.push('/events');  // Fallback to events list
            }
          },
          onError: (error) => {
            console.error("Error creating event:", error);
            toast({
              title: "Fehler",
              description: `Fehler beim Erstellen: ${error.message}`,
              variant: "destructive",
            });
          }
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  // Inside the component function, add these state variables:
  const [monthlyRecurrenceType, setMonthlyRecurrenceType] = useState<"byDate" | "byWeekday">(
    initialData?.recurringPattern === "monthly" && initialData?.recurringDays?.length === 2 
      ? "byWeekday" 
      : "byDate"
  );

  const occurrenceOptions = [
    { value: "1", label: "Ersten" },
    { value: "2", label: "Zweiten" },
    { value: "3", label: "Dritten" },
    { value: "4", label: "Vierten" },
  ];

  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [selectedRecurringDates, setSelectedRecurringDates] = useState<Date[]>([]);

  const handleRecurringDatesSelect = (dates: Date[]) => {
    setSelectedRecurringDates(dates);
    
    // Update the form with the selected dates
    // For monthly recurrence, we store the days of the month
    if (recurringPattern === "monthly" && monthlyRecurrenceType === "byDate") {
      const daysOfMonth = dates.map(date => date.getDate());
      form.setValue("recurringDays", daysOfMonth);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl>
                  <Input placeholder="Gib deinem Event einen Namen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Art des Events</FormLabel>
                <FormControl>
                  <Tabs 
                    value={field.value} 
                    onValueChange={field.onChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="once">Einmaliges Event</TabsTrigger>
                      <TabsTrigger value="recurring">Regelmäßiges Event</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="once" className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Startzeit</FormLabel>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full justify-between"
                            onClick={() => openDateTimePicker('start')}
                          >
                            {startDate ? format(startDate, 'PPP, HH:mm') : 'Datum und Uhrzeit wählen'}
                          </Button>
                        </div>
                        <div>
                          <FormLabel>Endzeit (optional)</FormLabel>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full justify-between"
                            onClick={() => openDateTimePicker('end')}
                          >
                            {endDate ? format(endDate, 'PPP, HH:mm') : 'Datum und Uhrzeit wählen'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="recurring" className="space-y-4 pt-4">
                      <div>
                        <FormLabel>Wiederholungsmuster</FormLabel>
                        <FormField
                          control={form.control}
                          name="recurringPattern"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={form.formState.isSubmitting}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Wähle ein Wiederholungsmuster" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Täglich</SelectItem>
                                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                                  <SelectItem value="monthly">Monatlich</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {recurringPattern === "weekly" && (
                        <div>
                          <FormLabel>Wochentage</FormLabel>
                          <FormField
                            control={form.control}
                            name="recurringDays"
                            render={() => (
                              <FormItem>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {daysOfWeek.map((day) => (
                                    <FormField
                                      key={day.id}
                                      control={form.control}
                                      name="recurringDays"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={day.id}
                                            className="flex flex-row items-center space-x-2 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(day.id)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value || [], day.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== day.id
                                                        )
                                                      )
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer">
                                              {day.label}
                                            </FormLabel>
                                          </FormItem>
                                        )
                                      }}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {recurringPattern === "monthly" && (
                        <div className="space-y-4">
                          <div>
                            <FormLabel>Wiederholungsart</FormLabel>
                            <Select
                              value={monthlyRecurrenceType}
                              onValueChange={(value: "byDate" | "byWeekday") => {
                                setMonthlyRecurrenceType(value);
                                // Reset the recurring days when switching type
                                form.setValue("recurringDays", []);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Wähle eine Wiederholungsart" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="byDate">Am gleichen Tag des Monats</SelectItem>
                                <SelectItem value="byWeekday">Am bestimmten Wochentag des Monats</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {monthlyRecurrenceType === "byDate" && (
                            <div>
                              <FormLabel>Tage im Monat</FormLabel>
                              <div className="mt-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="w-full justify-between"
                                  onClick={() => setIsCustomDatePickerOpen(true)}
                                >
                                  {selectedRecurringDates.length > 0 
                                    ? `${selectedRecurringDates.length} Tag(e) ausgewählt` 
                                    : 'Tage auswählen'}
                                </Button>
                                
                                {/* Display selected dates */}
                                {selectedRecurringDates.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {selectedRecurringDates
                                      .sort((a, b) => a.getDate() - b.getDate())
                                      .map((date, index) => (
                                        <div 
                                          key={index} 
                                          className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm"
                                        >
                                          {date.getDate()}
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                                
                                {/* Custom date picker dialog */}
                                <CustomDatePicker
                                  selectedDates={selectedRecurringDates}
                                  onDateSelect={handleRecurringDatesSelect}
                                  open={isCustomDatePickerOpen}
                                  onOpenChange={setIsCustomDatePickerOpen}
                                  title="Tage im Monat auswählen"
                                  allowMultiple={true}
                                />
                              </div>
                            </div>
                          )}
                          
                          {monthlyRecurrenceType === "byWeekday" && (
                            <div className="space-y-4">
                              <div>
                                <FormLabel>Welcher</FormLabel>
                                <FormField
                                  control={form.control}
                                  name="monthlyWeekdayOccurrence"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          
                                          // Update recurringDays to store both occurrence and day
                                          const currentDay = form.getValues("monthlyWeekdayDay") || "0";
                                          form.setValue("recurringDays", [
                                            parseInt(value), 
                                            parseInt(currentDay)
                                          ]);
                                        }}
                                        disabled={form.formState.isSubmitting}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Wähle eine Option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {occurrenceOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div>
                                <FormLabel>Wochentag</FormLabel>
                                <FormField
                                  control={form.control}
                                  name="monthlyWeekdayDay"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          
                                          // Update recurringDays to store both occurrence and day
                                          const currentOccurrence = form.getValues("monthlyWeekdayOccurrence") || "1";
                                          form.setValue("recurringDays", [
                                            parseInt(currentOccurrence), 
                                            parseInt(value)
                                          ]);
                                        }}
                                        disabled={form.formState.isSubmitting}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Wähle einen Wochentag" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {daysOfWeek.map((day) => (
                                            <SelectItem key={day.id} value={day.id.toString()}>
                                              {day.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Uhrzeit</FormLabel>
                          <div className="flex space-x-2 border rounded-md p-2 bg-background">
                            <TimeField 
                              value={{ 
                                hours: startDate?.getHours() || 0, 
                                minutes: startDate?.getMinutes() || 0 
                              }} 
                              onChange={(time: TimeValue) => {
                                const newDate = startDate || new Date();
                                newDate.setHours(time.hours || 0, time.minutes || 0);
                                setStartDate(newDate);
                              }}
                              className="z-50"
                            />
                          </div>
                        </div>
                        <div>
                          <FormLabel>Ende (optional)</FormLabel>
                          <div className="flex space-x-2 border rounded-md p-2 bg-background">
                            <TimeField 
                              value={{ 
                                hours: endDate?.getHours() || 0, 
                                minutes: endDate?.getMinutes() || 0 
                              }} 
                              onChange={(time: TimeValue) => {
                                const newDate = endDate || new Date();
                                newDate.setHours(time.hours || 0, time.minutes || 0);
                                setEndDate(newDate);
                              }}
                              className="z-50"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <FormLabel>Endet am (optional)</FormLabel>
                        <DateTimePicker 
                          date={recurringEndDate}
                          setDate={setRecurringEndDate}
                          disabled={form.formState.isSubmitting}
                          showTimePicker={false}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ort (Optional)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={form.formState.isSubmitting || Boolean(preselectedLocationId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Ort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keinen Ort auswählen</SelectItem>
                    {Array.isArray(locations) && locations.map((location: { id: string; name: string; address?: string | null; sport?: string }) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} {location.address ? `(${location.address})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gruppe (Optional)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={form.formState.isSubmitting || Boolean(preselectedGroupId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Gruppe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Gruppe auswählen</SelectItem>
                    {Array.isArray(groups) && groups.map((group: { id: string; name: string; isPrivate?: boolean }) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.isPrivate ? "(Privat)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beschreibung (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Beschreibe dein Event..." 
                    className="min-h-32" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Event Bild (Optional)</FormLabel>
            <ImageUploader 
              value={images} 
              onChange={setImages} 
              maxFiles={1} 
              folder="events"
              disabled={form.formState.isSubmitting}
            />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Wird gespeichert..."
              : isEditing
              ? "Event aktualisieren"
              : "Event erstellen"
            }
          </Button>
        </form>
      </Form>

      {/* Start Time Dialog */}
      <Dialog open={startTimeDialogOpen} onOpenChange={setStartTimeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {datePickerStage === 'date' ? 'Wähle das Datum' : 'Wähle die Uhrzeit'}
            </DialogTitle>
          </DialogHeader>
          
          {datePickerStage === 'date' ? (
            <div className="py-4">
              <Calendar
                mode="single"
                selected={tempSelectedDate}
                onSelect={handleDateSelection}
                className="rounded-md border"
              />
            </div>
          ) : (
            <div className="py-4">
              <TimeField 
                value={tempSelectedTime} 
                onChange={handleTimeSelection}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (datePickerStage === 'time') {
                  setDatePickerStage('date');
                } else {
                  setStartTimeDialogOpen(false);
                }
              }}
            >
              {datePickerStage === 'time' ? 'Zurück' : 'Abbrechen'}
            </Button>
            <Button 
              type="button" 
              onClick={confirmDateTime}
              className={cn(
                datePickerStage === 'date' && !tempSelectedDate && "opacity-50 cursor-not-allowed"
              )}
              disabled={datePickerStage === 'date' && !tempSelectedDate}
            >
              {datePickerStage === 'date' ? 'Weiter' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Time Dialog */}
      <Dialog open={endTimeDialogOpen} onOpenChange={setEndTimeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {datePickerStage === 'date' ? 'Wähle das Datum' : 'Wähle die Uhrzeit'}
            </DialogTitle>
          </DialogHeader>
          
          {datePickerStage === 'date' ? (
            <div className="py-4">
              <Calendar
                mode="single"
                selected={tempSelectedDate}
                onSelect={handleDateSelection}
                className="rounded-md border"
              />
            </div>
          ) : (
            <div className="py-4">
              <TimeField 
                value={tempSelectedTime} 
                onChange={handleTimeSelection}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (datePickerStage === 'time') {
                  setDatePickerStage('date');
                } else {
                  setEndTimeDialogOpen(false);
                }
              }}
            >
              {datePickerStage === 'time' ? 'Zurück' : 'Abbrechen'}
            </Button>
            <Button 
              type="button" 
              onClick={confirmDateTime}
              className={cn(
                datePickerStage === 'date' && !tempSelectedDate && "opacity-50 cursor-not-allowed"
              )}
              disabled={datePickerStage === 'date' && !tempSelectedDate}
            >
              {datePickerStage === 'date' ? 'Weiter' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 