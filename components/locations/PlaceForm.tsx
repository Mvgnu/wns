'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

// Define schema for place form
const placeFormSchema = z.object({
  // Common fields for all place types
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  placeType: z.enum(['facility', 'trail', 'spot']),
  detailType: z.string(),
  sport: z.string(),
  sports: z.array(z.string()).min(1, 'At least one sport is required'),
  latitude: z.number(),
  longitude: z.number(), 
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  
  // Fields for facilities
  priceRange: z.string().optional(),
  capacity: z.number().optional(),
  hasParking: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  openingHours: z.record(z.string(), z.any()).optional(),
  
  // Fields for trails
  isLineBased: z.boolean().optional(),
  difficulty: z.string().optional(),
  distance: z.number().optional(),
  elevation: z.number().optional(),
  
  // Admin fields
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
});

type PlaceFormValues = z.infer<typeof placeFormSchema>;

// Available detail types for each place type
const detailTypes = {
  facility: [
    { value: 'gym', label: 'Gym' },
    { value: 'studio', label: 'Studio' },
    { value: 'skatepark', label: 'Skatepark' },
    { value: 'court', label: 'Court' },
    { value: 'field', label: 'Field/Pitch' },
    { value: 'pool', label: 'Swimming Pool' },
  ],
  trail: [
    { value: 'hiking', label: 'Hiking Trail' },
    { value: 'biking', label: 'Biking Trail' },
    { value: 'running', label: 'Running Path' },
    { value: 'route', label: 'Route' },
  ],
  spot: [
    { value: 'general', label: 'General Spot' },
    { value: 'viewpoint', label: 'Viewpoint' },
    { value: 'water', label: 'Water Spot' },
    { value: 'climbing', label: 'Climbing Area' },
  ],
};

// Sports list
const sportsList = [
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Swimming',
  'Fitness',
  'Yoga',
  'Pilates',
  'Climbing',
  'Skateboarding',
  'Hiking',
  'Running',
  'Cycling',
  'Water Sports',
  'Martial Arts',
  'Dance',
  'Other',
];

// Price range options
const priceRangeOptions = [
  { value: 'free', label: 'Free' },
  { value: 'low', label: '€ (Budget)' },
  { value: 'medium', label: '€€ (Mid-range)' },
  { value: 'high', label: '€€€ (Premium)' },
];

// Difficulty options
const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

interface PlaceFormProps {
  initialData?: any;
  isEditMode?: boolean;
  isAdmin?: boolean;
}

export default function PlaceForm({ 
  initialData, 
  isEditMode = false,
  isAdmin = false,
}: PlaceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedDetailTypes, setSelectedDetailTypes] = useState<any[]>(detailTypes.facility);
  const [mapPosition, setMapPosition] = useState({ lat: 0, lng: 0 });
  
  // Initialize form with default values or existing data
  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      placeType: 'facility',
      detailType: 'gym',
      sport: 'Fitness',
      sports: ['Fitness'],
      latitude: 0,
      longitude: 0,
      address: '',
      website: '',
      phone: '',
      email: '',
      priceRange: 'free',
      hasParking: false,
      isAccessible: false,
      isLineBased: false,
      verified: false,
      featured: false,
    },
  });
  
  const selectedPlaceType = form.watch('placeType');
  
  // Update detail types when place type changes
  useEffect(() => {
    if (selectedPlaceType) {
      setSelectedDetailTypes(detailTypes[selectedPlaceType as keyof typeof detailTypes]);
      // Reset detail type to first option of new place type
      form.setValue('detailType', detailTypes[selectedPlaceType as keyof typeof detailTypes][0].value);
    }
  }, [selectedPlaceType, form]);
  
  // Handle form submission
  const onSubmit = async (values: PlaceFormValues) => {
    setIsSubmitting(true);
    
    try {
      const apiUrl = isEditMode 
        ? `/api/places/${initialData.id}` 
        : '/api/places';
      
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save place');
      }
      
      const data = await response.json();
      
      toast({
        title: isEditMode ? 'Place updated' : 'Place created',
        description: isEditMode 
          ? 'The place has been updated successfully.' 
          : 'The place has been created successfully.',
        variant: 'default',
      });
      
      // Redirect to place detail page
      router.push(`/locations/${data.place.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error saving place:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save place',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to determine if a field should be shown based on place type
  const showFieldForType = (types: string[]) => {
    return types.includes(selectedPlaceType);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details about this place.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter place name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Description field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this place" 
                          className="min-h-[120px]" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Place Type */}
                <FormField
                  control={form.control}
                  name="placeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a place type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="facility">Facility</SelectItem>
                          <SelectItem value="trail">Trail</SelectItem>
                          <SelectItem value="spot">Spot</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This determines what kind of place this is and what information to collect.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Detail Type */}
                <FormField
                  control={form.control}
                  name="detailType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detail Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a detail type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedDetailTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Sport field */}
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Sport</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sportsList.map((sport) => (
                            <SelectItem key={sport} value={sport}>
                              {sport}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Sports (multiple) */}
                <div>
                  <FormLabel>Sports Available</FormLabel>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {sportsList.map((sport) => (
                      <div key={sport} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sport-${sport}`}
                          checked={form.watch('sports').includes(sport)}
                          onCheckedChange={(checked) => {
                            const currentSports = form.watch('sports');
                            if (checked) {
                              form.setValue('sports', [...currentSports, sport]);
                            } else {
                              form.setValue(
                                'sports',
                                currentSports.filter((s) => s !== sport)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`sport-${sport}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {sport}
                        </label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.sports && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      {form.formState.errors.sports.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Place Details</CardTitle>
                <CardDescription>
                  Additional details about this place.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact details section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact & Business Information</h3>
                  
                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 123-4567" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="contact@example.com" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Facility-specific fields */}
                {showFieldForType(['facility']) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Facility Details</h3>
                    
                    {/* Price Range */}
                    <FormField
                      control={form.control}
                      name="priceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Range</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select price range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {priceRangeOptions.map((option) => (
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
                    
                    {/* Capacity */}
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Maximum capacity" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            The maximum number of people this facility can accommodate.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Has Parking */}
                    <FormField
                      control={form.control}
                      name="hasParking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Parking Available
                            </FormLabel>
                            <FormDescription>
                              This facility has parking spaces.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Accessibility */}
                    <FormField
                      control={form.control}
                      name="isAccessible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Wheelchair Accessible
                            </FormLabel>
                            <FormDescription>
                              This facility is wheelchair accessible.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Trail-specific fields */}
                {showFieldForType(['trail']) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Trail Details</h3>
                    
                    {/* Is Line Based */}
                    <FormField
                      control={form.control}
                      name="isLineBased"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Line-Based Route
                            </FormLabel>
                            <FormDescription>
                              This represents a trail or route with multiple waypoints.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Trail Difficulty */}
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficultyOptions.map((option) => (
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
                    
                    {/* Distance */}
                    <FormField
                      control={form.control}
                      name="distance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distance (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="Distance in kilometers" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Elevation */}
                    <FormField
                      control={form.control}
                      name="elevation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Elevation Gain (meters)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Elevation gain in meters" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Spot-specific fields */}
                {showFieldForType(['spot']) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Spot Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Add any additional details for this spot using the description field in the Basic Info tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Location Tab */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>
                  Set the location of this place on the map.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter address" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Latitude */}
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="Latitude" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Longitude */}
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="Longitude" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Map */}
                <div className="mt-4 border rounded-md p-2">
                  <div className="bg-gray-100 h-[300px] rounded flex items-center justify-center">
                    <span className="text-gray-500">Map component will be integrated here</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on the map to set the location or search for an address above.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Administrative Settings</CardTitle>
                  <CardDescription>
                    These options are only available to administrators.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Verified */}
                  <FormField
                    control={form.control}
                    name="verified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Verified Place
                          </FormLabel>
                          <FormDescription>
                            Mark this place as officially verified by administrators.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* Featured */}
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Featured Place
                          </FormLabel>
                          <FormDescription>
                            Feature this place in listings and recommendations.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Place' : 'Create Place'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 