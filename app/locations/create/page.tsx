'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LocationMapPicker from '@/components/locations/LocationMapPicker';
import { MultiSelect } from '@/components/ui/multi-select';
import { allSports } from '@/lib/sportsData';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { toast } from 'react-hot-toast';

// Register FilePond plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

// Define form schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  type: z.string().min(1, 'Type is required'),
  sport: z.string().min(1, 'Sport is required'),
  sports: z.array(z.string()).default([]),
  address: z.string().optional(),
  isLineBased: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLocationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/locations/create');
    }
  }, [status, router]);

  // Use session data for user information when submitting
  const userId = session?.user?.id;

  // Define types for the state variables
  type Coordinate = {
    latitude: number;
    longitude: number;
  };

  const [images, setImages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);
  const [lineCoordinates, setLineCoordinates] = useState<Coordinate[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '',
      sport: '',
      sports: [],
      address: '',
      isLineBased: false,
    }
  });

  const isLineBased = watch('isLineBased');

  // Convert allSports to options for MultiSelect
  const sportOptions = allSports.map(sport => ({
    value: sport.value,
    label: sport.label
  }));

  // Handle sport selection change
  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sport = e.target.value;
    setSelectedSport(sport);
    setValue('sport', sport);
    
    // If this is the first sport, add it to the sports array too
    if (selectedSports.length === 0) {
      setSelectedSports([sport]);
      setValue('sports', [sport]);
    }
    
    // Set isLineBased based on sport
    if (['mountain_biking', 'hiking', 'running'].includes(sport)) {
      setValue('isLineBased', true);
    } else {
      setValue('isLineBased', false);
    }
  };

  // Handle multiple sports selection
  const handleSportsChange = (selected: string[]) => {
    setSelectedSports(selected);
    setValue('sports', selected);
    
    // If there's at least one sport selected, set the primary sport
    if (selected.length > 0 && !selectedSport) {
      setSelectedSport(selected[0]);
      setValue('sport', selected[0]);
    }
    
    // If the primary sport is removed, update it
    if (selectedSport && !selected.includes(selectedSport) && selected.length > 0) {
      setSelectedSport(selected[0]);
      setValue('sport', selected[0]);
    } else if (selected.length === 0) {
      setSelectedSport('');
      setValue('sport', '');
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!coordinates && !isLineBased) {
      toast.error("Please select a location on the map");
      return;
    }

    if (isLineBased && lineCoordinates.length < 2) {
      toast.error("Please draw a route with at least 2 points");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare image uploads
      const imageUrls = [];
      for (const image of images) {
        // For FilePond, the file object is in a different structure
        const file = image.file || image;
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'wns_community');

          const response = await fetch('https://api.cloudinary.com/v1_1/wns-community/image/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          imageUrls.push(data.secure_url);
        }
      }

      // Prepare location data
      const locationData = {
        ...data,
        latitude: coordinates ? coordinates.latitude : lineCoordinates[0]?.latitude,
        longitude: coordinates ? coordinates.longitude : lineCoordinates[0]?.longitude,
        images: imageUrls,
        isLineBased,
        coordinates: isLineBased ? lineCoordinates : null,
      };

      // Submit to API
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        const location = await response.json();
        toast.success('Location added successfully!');
        router.push(`/locations/${location.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add location');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error('An error occurred while adding the location');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // We'll redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Add a New Location</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="mt-1"
                  placeholder="Enter a name for this location"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sport">Primary Sport</Label>
                  <select
                    id="sport"
                    {...register('sport')}
                    className="w-full mt-1 bg-background text-foreground rounded-md border border-input py-2 px-3"
                    onChange={handleSportChange}
                    value={selectedSport}
                  >
                    <option value="">Select a sport</option>
                    {allSports.map(sport => (
                      <option key={sport.value} value={sport.value}>{sport.label}</option>
                    ))}
                  </select>
                  {errors.sport && (
                    <p className="text-red-500 text-sm mt-1">{errors.sport.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Location Type</Label>
                  <Input
                    id="type"
                    {...register('type')}
                    className="mt-1"
                    placeholder="Enter a type (e.g., trail, skatepark, etc.)"
                  />
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sports">Sports (Multiple Selection)</Label>
                <MultiSelect
                  options={sportOptions}
                  selected={selectedSports}
                  onChange={handleSportsChange}
                  placeholder="Select sports for this location"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Select all sports that can be practiced at this location
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="mt-1"
                  rows={4}
                  placeholder="Describe this location"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  {...register('address')}
                  className="mt-1"
                  placeholder="Enter an address"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isLineBased"
                    {...register('isLineBased')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isLineBased" className="ml-2">
                    This is a route or trail (line-based location)
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  {isLineBased 
                    ? "For trails and routes, you'll draw a line on the map by clicking multiple points." 
                    : "For spots, just click once on the map to mark the exact location."}
                </p>
              </div>

              <div>
                <Label>Location on Map</Label>
                <div className="mt-1 border border-input rounded-md overflow-hidden">
                  <div className="bg-blue-50 p-3 text-sm text-blue-800 border-b border-blue-200">
                    <strong>How to use the map:</strong>
                    {isLineBased ? (
                      <ul className="mt-1 list-disc pl-5">
                        <li>Click on the map to start your route</li>
                        <li>Continue clicking to add more points to your route</li>
                        <li>Use the Reset button to start over if needed</li>
                        <li>Your route needs at least 2 points to be valid</li>
                      </ul>
                    ) : (
                      <ul className="mt-1 list-disc pl-5">
                        <li>Click on the map to set the location point</li>
                        <li>You can click again to move the location marker</li>
                      </ul>
                    )}
                  </div>
                  <div className="h-96">
                    <LocationMapPicker
                      position={{ lat: coordinates ? coordinates.latitude : 51.505, lng: coordinates ? coordinates.longitude : -0.09 }}
                      onPositionChange={(position) => setCoordinates({ latitude: position.lat, longitude: position.lng })}
                      isLineBased={isLineBased}
                      initialCoordinates={isLineBased ? lineCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude })) : undefined}
                      onCoordinatesChange={coords => setLineCoordinates(coords.map(coord => ({ latitude: coord.lat, longitude: coord.lng })))}
                    />
                  </div>
                </div>
                {!coordinates && !isLineBased && (
                  <p className="text-red-500 text-sm mt-1">Please select a location on the map</p>
                )}
                {isLineBased && lineCoordinates.length < 2 && (
                  <p className="text-red-500 text-sm mt-1">Please draw a route with at least 2 points</p>
                )}
              </div>

              <div>
                <Label>Images</Label>
                <div className="mb-2 text-sm text-gray-500">
                  Upload up to 5 images. The first image will be used as the main cover image, and all images will appear in the gallery.
                </div>
                <FilePond
                  files={images}
                  onupdatefiles={setImages}
                  allowMultiple={true}
                  maxFiles={5}
                  acceptedFileTypes={['image/*']}
                  labelIdle='Drag & drop images or <span class="filepond--label-action">browse</span>'
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (isLineBased ? lineCoordinates.length < 2 : !coordinates)}
                >
                  {isSubmitting ? 'Submitting...' : 'Add Location'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 