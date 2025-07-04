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
import { EventPricing } from "@/components/events/EventPricing";
import { EventAmenities } from "@/components/events/EventAmenities";
import { EventCoOrganizers } from "@/components/events/EventCoOrganizers";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  // Who can join the event
  joinRestriction: z.enum(["everyone", "groupOnly"]).default("everyone"),
  // New fields for event pricing
  isPaid: z.boolean().default(false),
  price: z.number().optional(),
  priceCurrency: z.string().optional(),
  priceDescription: z.string().optional(),
  maxAttendees: z.number().int().positive().optional(),
  // New field for highlighted amenities
  highlightedAmenities: z.array(z.string()).optional(),
  // New field for co-organizers
  coOrganizers: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      image: z.string().optional(),
      role: z.string().optional(),
    })
  ).optional(),
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
    joinRestriction?: "everyone" | "groupOnly";
    // New fields
    isPaid?: boolean;
    price?: number;
    priceCurrency?: string;
    priceDescription?: string;
    maxAttendees?: number;
    highlightedAmenities?: string[];
    // Co-organizers will be fetched separately
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
  const { data: fetchedLocations } = useLocations(1, 100);
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
  const locations = propLocations || (fetchedLocations?.locations || []);
  
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
      joinRestriction: initialData?.joinRestriction as "everyone" | "groupOnly" || "everyone",
      isPaid: initialData?.isPaid || false,
      price: initialData?.price,
      priceCurrency: initialData?.priceCurrency || 'EUR',
      priceDescription: initialData?.priceDescription || '',
      maxAttendees: initialData?.maxAttendees,
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

  // Initialize pricing data with correct types
  const [pricingData, setPricingData] = useState<{
    isPaid: boolean;
    price?: number;
    priceCurrency: string;
    priceDescription: string;
    maxAttendees?: number;
  }>({
    isPaid: initialData?.isPaid || false,
    price: initialData?.price,
    priceCurrency: initialData?.priceCurrency || 'EUR',
    priceDescription: initialData?.priceDescription || '',
    maxAttendees: initialData?.maxAttendees
  });

  // Handler for pricing data changes
  const handlePricingChange = (data: {
    isPaid: boolean;
    price?: number;
    priceCurrency?: string;
    priceDescription?: string;
    maxAttendees?: number;
  }) => {
    setPricingData({
      isPaid: data.isPaid,
      price: data.price,
      priceCurrency: data.priceCurrency || 'EUR',
      priceDescription: data.priceDescription || '',
      maxAttendees: data.maxAttendees
    });
  };
  
  // Handler for amenities changes
  const handleAmenitiesChange = (amenityIds: string[]) => {
    setSelectedAmenities(amenityIds);
  };
  
  // Handler for co-organizers changes
  const handleCoOrganizersChange = (newCoOrganizers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role?: string;
  }>) => {
    setCoOrganizers(newCoOrganizers);
  };

  // Add new state variables for our enhanced features
  const [locationAmenities, setLocationAmenities] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
  }>>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialData?.highlightedAmenities || []
  );
  const [coOrganizers, setCoOrganizers] = useState<Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role?: string;
  }>>([]);

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                // Create a completely new date object instead of modifying the existing one
                                const newDate = new Date(startDate || new Date());
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
                                // Create a completely new date object instead of modifying the existing one
                                const newDate = new Date(endDate || new Date());
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

          {/* Who can join - only show if a group is selected */}
          {form.watch("groupId") !== "none" && (
            <FormField
              control={form.control}
              name="joinRestriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wer kann teilnehmen?</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Jeder kann teilnehmen</SelectItem>
                      <SelectItem value="groupOnly">Nur Gruppenmitglieder</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "groupOnly" 
                      ? "Nur Mitglieder der ausgewählten Gruppe können teilnehmen" 
                      : "Jeder kann teilnehmen, auch wenn er kein Gruppenmitglied ist"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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

          {/* Add pricing section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Event Pricing & Capacity</h3>
            <Card>
              <CardContent className="pt-6">
                <EventPricing
                  isPaid={pricingData.isPaid}
                  price={pricingData.price}
                  priceCurrency={pricingData.priceCurrency}
                  priceDescription={pricingData.priceDescription}
                  maxAttendees={pricingData.maxAttendees}
                  onChange={handlePricingChange}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Show amenities section only if a location is selected */}
          {form.watch('locationId') && form.watch('locationId') !== 'none' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Highlight Location Amenities</h3>
              <Card>
                <CardContent className="pt-6">
                  <EventAmenities
                    locationId={form.watch('locationId')}
                    locationAmenities={locationAmenities}
                    highlightedAmenities={selectedAmenities}
                    onChange={handleAmenitiesChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Co-organizers section - only show on edit mode since we need the event ID */}
          {isEditing && initialData?.id && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Event Co-Organizers</h3>
              <Card>
                <CardContent className="pt-6">
                  <EventCoOrganizers
                    eventId={initialData.id}
                    existingCoOrganizers={coOrganizers}
                    onChange={handleCoOrganizersChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <Button type="submit" className="w-full">
            {isEditing ? "Event aktualisieren" : "Event erstellen"}
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
    </div>
  );
} 