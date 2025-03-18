"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import ImageUploader from "@/components/ui/ImageUploader";
import LocationMapPicker from "@/components/locations/LocationMapPicker";
import { useCreateLocation, useUpdateLocation } from "@/hooks/useLocations";
import { useRouter } from "next/navigation";
import { allSports, getSportByValue } from "@/lib/sportsData";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein").max(100, "Name darf maximal 100 Zeichen lang sein"),
  description: z.string().max(1000, "Beschreibung darf maximal 1000 Zeichen lang sein").optional(),
  type: z.string().min(1, "Typ ist erforderlich"),
  sports: z.array(z.string()).min(1, "Mindestens eine Sportart ist erforderlich"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  isLineBased: z.boolean().default(false),
  coordinates: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LocationFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    sport: string;
    sports?: string[];
    latitude: number;
    longitude: number;
    address?: string;
    images: string[];
    isLineBased: boolean;
    coordinates?: any;
  };
  isEditing?: boolean;
}

export default function LocationForm({ initialData, isEditing = false }: LocationFormProps) {
  const router = useRouter();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [mapPosition, setMapPosition] = useState({
    lat: initialData?.latitude || 51.505,
    lng: initialData?.longitude || -0.09,
  });

  // Get sports for the dropdown list
  const sportOptions: OptionType[] = allSports.map(sport => ({
    value: sport.value,
    label: sport.label,
    group: sport.category
  }));

  // Initialize sports array from either the sports array or the single sport
  const initialSports = initialData?.sports || 
    (initialData?.sport ? [initialData.sport] : []);

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "",
      sports: initialSports,
      latitude: initialData?.latitude || 51.505,
      longitude: initialData?.longitude || -0.09,
      address: initialData?.address || "",
      isLineBased: initialData?.isLineBased || false,
      coordinates: initialData?.coordinates || null,
    },
  });

  // Update form values when map position changes
  const handleMapPositionChange = (position: { lat: number; lng: number }) => {
    setMapPosition(position);
    form.setValue("latitude", position.lat);
    form.setValue("longitude", position.lng);
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    // Filter out invalid images (ensure they're all strings)
    const validImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
    
    console.log("Location images before submission:", validImages);
    
    // Use the first sport from the sports array as the main sport
    const primarySport = values.sports[0] || "";
    
    // Add the valid images from the state
    const locationData = {
      ...values,
      sport: primarySport, // For backward compatibility
      images: validImages,
    };

    console.log("Submitting location data:", JSON.stringify(locationData, null, 2));

    if (isEditing && initialData) {
      // Update existing location
      updateLocation.mutate({
        id: initialData.id,
        data: locationData,
      }, {
        onSuccess: () => {
          router.push(`/locations/${initialData.id}`);
        },
      });
    } else {
      // Create new location
      createLocation.mutate(locationData as any, {
        onSuccess: (newLocation) => {
          router.push(`/locations/${newLocation.id}`);
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name des Ortes</FormLabel>
              <FormControl>
                <Input placeholder="Name des Ortes eingeben" {...field} />
              </FormControl>
              <FormDescription>
                Wähle einen Namen, der diesen Ort eindeutig identifiziert.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Art des Ortes</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Skatepark, Wanderweg, Angelplatz" {...field} />
                </FormControl>
                <FormDescription>
                  Um welche Art von Ort handelt es sich?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sports"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sportarten</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={sportOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Sportarten auswählen"
                    groupedOptions={true}
                  />
                </FormControl>
                <FormDescription>
                  Wähle eine oder mehrere Sportarten, für die dieser Ort geeignet ist.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Gib die Adresse ein" {...field} />
              </FormControl>
              <FormDescription>
                Gib eine Adresse an, um anderen zu helfen, diesen Ort zu finden.
              </FormDescription>
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
                  placeholder="Beschreibe diesen Ort..." 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Gib Details zu diesem Ort an, wie z.B. Besonderheiten, Schwierigkeitsgrad, beste Besuchszeiten usw.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Bilder (Optional)</FormLabel>
          <ImageUploader 
            value={images} 
            onChange={setImages} 
            maxFiles={5} 
            folder="locations"
            disabled={createLocation.isPending || updateLocation.isPending}
          />
          <FormDescription>
            Lade bis zu 5 Bilder hoch, die diesen Ort zeigen.
          </FormDescription>
        </div>

        <div className="space-y-2">
          <FormLabel>Position auf der Karte</FormLabel>
          <FormDescription>
            Setze den Marker auf die genaue Position dieses Ortes.
          </FormDescription>
          <div className="h-[400px] rounded-md overflow-hidden border">
            <LocationMapPicker 
              position={mapPosition} 
              onPositionChange={handleMapPositionChange}
              isLineBased={form.watch('isLineBased')}
              onCoordinatesChange={(coords) => form.setValue('coordinates', coords)}
              initialCoordinates={initialData?.coordinates}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={createLocation.isPending || updateLocation.isPending}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit"
            disabled={createLocation.isPending || updateLocation.isPending}
          >
            {createLocation.isPending || updateLocation.isPending
              ? "Wird gespeichert..."
              : isEditing
              ? "Ort aktualisieren"
              : "Ort erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 