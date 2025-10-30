'use client';

import { useState } from 'react';
import { 
  Check,
  X,
  Plus,
  Car,
  Coffee,
  Droplet,
  Home,
  Lock, 
  ShieldCheck,
  Flag,
  Image as ImageIcon,
  Award,
  Users,
  Bath,
  Wifi,
  ShoppingBag,
  User,
  Divide,
  AlignJustify,
  Sun,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { standardAmenities, getRelevantAmenities, Amenity } from '@/lib/amenities';

// Type for amenity data from API
interface PlaceAmenity {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  locationId: string;
}

interface PlaceAmenitiesProps {
  placeId: string;
  placeType: 'facility' | 'trail' | 'spot';
  amenities: PlaceAmenity[];
  canEdit: boolean;
}

// Helper to get icon component by name
export function getIconByName(iconName: string | null | undefined) {
  if (!iconName) return null;
  
  const iconMap: Record<string, React.ReactNode> = {
    'car': <Car className="h-4 w-4" />,
    'coffee': <Coffee className="h-4 w-4" />,
    'droplet': <Droplet className="h-4 w-4" />,
    'home': <Home className="h-4 w-4" />,
    'lock': <Lock className="h-4 w-4" />,
    'shield': <ShieldCheck className="h-4 w-4" />,
    'flag': <Flag className="h-4 w-4" />,
    'image': <ImageIcon className="h-4 w-4" />,
    'accessibility': <Award className="h-4 w-4" />,
    'toilet': <Users className="h-4 w-4" />,
    'shower': <Bath className="h-4 w-4" />,
    'wifi': <Wifi className="h-4 w-4" />,
    'shopping-bag': <ShoppingBag className="h-4 w-4" />,
    'user': <User className="h-4 w-4" />,
    'divide': <Divide className="h-4 w-4" />,
    'align-justify': <AlignJustify className="h-4 w-4" />,
    'sun': <Sun className="h-4 w-4" />,
    'activity': <Activity className="h-4 w-4" />,
    'trending-up': <TrendingUp className="h-4 w-4" />,
  };
  
  return iconMap[iconName] || null;
}

export default function PlaceAmenities({ 
  placeId, 
  placeType, 
  amenities = [], 
  canEdit 
}: PlaceAmenitiesProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [placeAmenities, setPlaceAmenities] = useState<PlaceAmenity[]>(amenities);
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [customAmenityName, setCustomAmenityName] = useState('');
  const [customAmenityDescription, setCustomAmenityDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Get relevant predefined amenities for this place type
  const relevantAmenities = getRelevantAmenities(placeType);
  
  // Get IDs of currently added amenities
  const currentAmenityIds = placeAmenities.map(a => a.name.toLowerCase().replace(/\s+/g, '_'));
  
  // Filter relevant amenities to those not already added
  const availableAmenities = relevantAmenities.filter(
    amenity => !currentAmenityIds.includes(amenity.id)
  );
  
  // Add amenities to the place
  const addAmenities = async () => {
    if (selectedAmenities.length === 0 && !customAmenityName) {
      toast({
        title: "No amenities selected",
        description: "Please select at least one amenity to add",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const amenitiesToAdd = [
        // Add selected standard amenities
        ...selectedAmenities.map(id => {
          const amenity = standardAmenities.find(a => a.id === id);
          return {
            name: amenity?.name || id,
            icon: amenity?.icon,
            description: amenity?.description,
          };
        }),
        // Add custom amenity if provided
        ...(customAmenityName ? [{
          name: customAmenityName,
          description: customAmenityDescription || null,
          icon: null
        }] : [])
      ];
      
      const response = await fetch(`/api/places/${placeId}/amenities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amenities: amenitiesToAdd }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add amenities');
      }
      
      const data = await response.json();
      
      // Update local state
      setPlaceAmenities([...placeAmenities, ...data.amenities]);
      
      toast({
        title: "Amenities added",
        description: "The amenities have been added successfully",
        variant: "default"
      });
      
      // Reset form
      setSelectedAmenities([]);
      setCustomAmenityName('');
      setCustomAmenityDescription('');
      setIsAddingAmenity(false);
    } catch (error) {
      toast({
        title: "Failed to add amenities",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove an amenity
  const removeAmenity = async (amenityId: string) => {
    if (!confirm('Are you sure you want to remove this amenity?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/places/${placeId}/amenities/${amenityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove amenity');
      }
      
      // Update local state
      setPlaceAmenities(placeAmenities.filter(a => a.id !== amenityId));
      
      toast({
        title: "Amenity removed",
        description: "The amenity has been removed successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Failed to remove amenity",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Amenities & Features</h3>
        
        {canEdit && (
          <Dialog open={isAddingAmenity} onOpenChange={setIsAddingAmenity}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Amenities
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Amenities</DialogTitle>
                <DialogDescription>
                  Select from standard amenities or add a custom one.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Standard Amenities</div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableAmenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity.id}`}
                          checked={selectedAmenities.includes(amenity.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAmenities([...selectedAmenities, amenity.id]);
                            } else {
                              setSelectedAmenities(selectedAmenities.filter(id => id !== amenity.id));
                            }
                          }}
                        />
                        <Label htmlFor={`amenity-${amenity.id}`} className="text-sm flex items-center">
                          {getIconByName(amenity.icon) && (
                            <span className="mr-1">{getIconByName(amenity.icon)}</span>
                          )}
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Custom Amenity</div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="custom-name">Name</Label>
                      <Input
                        id="custom-name"
                        value={customAmenityName}
                        onChange={(e) => setCustomAmenityName(e.target.value)}
                        placeholder="Enter amenity name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-description">Description (optional)</Label>
                      <Input
                        id="custom-description"
                        value={customAmenityDescription}
                        onChange={(e) => setCustomAmenityDescription(e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingAmenity(false)}>
                  Cancel
                </Button>
                <Button onClick={addAmenities} disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Amenities'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {placeAmenities.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-gray-50">
          <p className="text-gray-500">No amenities listed for this place.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {placeAmenities.map((amenity) => {
            // Try to find matching standard amenity to get icon
            const standardAmenity = standardAmenities.find(
              a => a.id === amenity.name.toLowerCase().replace(/\s+/g, '_')
            );
            
            const icon = amenity.icon || standardAmenity?.icon;
            
            return (
              <div key={amenity.id} className="relative">
                <Badge 
                  variant="outline" 
                  className="px-3 py-1 flex items-center w-full justify-start hover:bg-accent"
                >
                  {getIconByName(icon) && (
                    <span className="mr-2">{getIconByName(icon)}</span>
                  )}
                  <span>{amenity.name}</span>
                  
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-auto"
                      onClick={() => removeAmenity(amenity.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 