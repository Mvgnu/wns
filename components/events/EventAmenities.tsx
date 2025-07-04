'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Tag,
  Car,
  Coffee,
  Droplet,
  Home,
  Lock, 
  ShieldCheck,
  Flag,
  Image,
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
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Amenity, standardAmenities } from '@/lib/amenities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Helper to get icon component by name
function getIconByName(iconName: string | null | undefined): React.ReactNode {
  if (!iconName) return null;
  
  const iconMap: Record<string, React.ReactNode> = {
    'car': <Car className="h-4 w-4" />,
    'coffee': <Coffee className="h-4 w-4" />,
    'droplet': <Droplet className="h-4 w-4" />,
    'home': <Home className="h-4 w-4" />,
    'lock': <Lock className="h-4 w-4" />,
    'shield': <ShieldCheck className="h-4 w-4" />,
    'flag': <Flag className="h-4 w-4" />,
    'image': <Image className="h-4 w-4" />,
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

interface EventAmenitiesProps {
  locationId?: string;
  locationAmenities?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  }[];
  highlightedAmenities?: string[];
  onChange?: (amenityIds: string[]) => void;
  readOnly?: boolean;
}

export function EventAmenities({
  locationId,
  locationAmenities = [],
  highlightedAmenities = [],
  onChange,
  readOnly = false,
}: EventAmenitiesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(highlightedAmenities);
  const [availableAmenities, setAvailableAmenities] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
  }>>(locationAmenities);
  
  // Update state when props change
  useEffect(() => {
    setSelectedAmenities(highlightedAmenities);
    if (locationAmenities.length > 0) {
      setAvailableAmenities(locationAmenities);
    }
  }, [highlightedAmenities, locationAmenities]);
  
  // Fetch location amenities if locationId is provided and no locationAmenities are passed
  useEffect(() => {
    if (!locationId || locationAmenities.length > 0 || readOnly) return;
    
    const fetchLocationAmenities = async () => {
      try {
        const response = await fetch(`/api/places/${locationId}/amenities`);
        if (!response.ok) throw new Error('Failed to fetch location amenities');
        
        const data = await response.json();
        setAvailableAmenities(data.amenities);
      } catch (error) {
        console.error('Error fetching location amenities:', error);
      }
    };
    
    fetchLocationAmenities();
  }, [locationId, locationAmenities, readOnly]);
  
  // Handle checkbox toggle
  const handleToggleAmenity = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    let newSelection: string[];
    
    if (isSelected) {
      newSelection = selectedAmenities.filter(id => id !== amenityId);
    } else {
      newSelection = [...selectedAmenities, amenityId];
    }
    
    setSelectedAmenities(newSelection);
  };
  
  // Handle save/confirm selection
  const handleSaveSelection = () => {
    if (onChange) {
      onChange(selectedAmenities);
    }
    setIsDialogOpen(false);
  };
  
  // Get amenity details by ID
  const getAmenityById = (id: string) => {
    return availableAmenities.find(amenity => amenity.id === id);
  };
  
  // Render amenity badges for read-only view
  const renderAmenityBadges = () => {
    if (selectedAmenities.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedAmenities.map(id => {
          const amenity = getAmenityById(id);
          if (!amenity) return null;
          
          const iconElement = getIconByName(amenity.icon);
          
          return (
            <Badge 
              key={id}
              variant="outline" 
              className="bg-muted/30 hover:bg-muted"
            >
              {iconElement && (
                <span className="mr-1">{iconElement}</span>
              )}
              {amenity.name}
            </Badge>
          );
        })}
      </div>
    );
  };
  
  if (readOnly) {
    return renderAmenityBadges();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Highlight Amenities
        </label>
        {selectedAmenities.length > 0 && (
          <Badge variant="outline">{selectedAmenities.length} selected</Badge>
        )}
      </div>

      {renderAmenityBadges()}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-1 w-full"
          >
            <Tag className="mr-2 h-4 w-4" />
            {selectedAmenities.length > 0 ? 'Edit Highlighted Amenities' : 'Highlight Location Amenities'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Highlight Amenities</DialogTitle>
          </DialogHeader>
          
          {availableAmenities.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No amenities are available for this location.
            </div>
          ) : (
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-4 py-2">
                {availableAmenities.map(amenity => {
                  const isChecked = selectedAmenities.includes(amenity.id);
                  const iconElement = getIconByName(amenity.icon);
                  
                  return (
                    <div key={amenity.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleAmenity(amenity.id)}
                      />
                      <div className="grid gap-1">
                        <label
                          htmlFor={`amenity-${amenity.id}`}
                          className={cn(
                            "flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                            isChecked && "text-primary"
                          )}
                        >
                          {iconElement && <span className="mr-1.5">{iconElement}</span>}
                          {amenity.name}
                        </label>
                        {amenity.description && (
                          <p className="text-xs text-muted-foreground">
                            {amenity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button type="button" onClick={() => setIsDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSelection}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <p className="text-xs text-muted-foreground mt-1">
        Highlight the amenities from this location that are relevant for your event.
      </p>
    </div>
  );
} 