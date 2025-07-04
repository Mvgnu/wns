'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Users, Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PricingTier } from '@/lib/prisma-extensions';

interface EventPricingTiersProps {
  eventId?: string;
  baseCurrency: string;
  existingTiers?: PricingTier[];
  isEditMode?: boolean;
  onChange?: (tiers: PricingTier[]) => void;
}

export function EventPricingTiers({
  eventId,
  baseCurrency,
  existingTiers = [],
  isEditMode = true,
  onChange
}: EventPricingTiersProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(existingTiers);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  
  // Form state for editing a tier
  const [tierName, setTierName] = useState('');
  const [tierDescription, setTierDescription] = useState('');
  const [tierPrice, setTierPrice] = useState(0);
  const [tierCapacity, setTierCapacity] = useState<number | null>(null);
  const [tierStartDate, setTierStartDate] = useState<Date | null>(null);
  const [tierEndDate, setTierEndDate] = useState<Date | null>(null);
  const [tierIsActive, setTierIsActive] = useState(true);
  
  // Update local state when props change
  useEffect(() => {
    setPricingTiers(existingTiers);
  }, [existingTiers]);
  
  // Reset form state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  // Initialize form with tier data for editing
  useEffect(() => {
    if (editingTier) {
      setTierName(editingTier.name);
      setTierDescription(editingTier.description || '');
      setTierPrice(editingTier.price);
      setTierCapacity(editingTier.capacity);
      setTierStartDate(editingTier.startDate ? new Date(editingTier.startDate) : null);
      setTierEndDate(editingTier.endDate ? new Date(editingTier.endDate) : null);
      setTierIsActive(editingTier.isActive);
    }
  }, [editingTier]);
  
  // Reset the form
  const resetForm = () => {
    setEditingTier(null);
    setTierName('');
    setTierDescription('');
    setTierPrice(0);
    setTierCapacity(null);
    setTierStartDate(null);
    setTierEndDate(null);
    setTierIsActive(true);
  };
  
  // Open dialog for adding a new tier
  const handleAddTier = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an existing tier
  const handleEditTier = (tier: PricingTier) => {
    setEditingTier(tier);
    setIsDialogOpen(true);
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    if (!tierName.trim()) {
      toast({
        title: "Error",
        description: "Tier name is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (tierPrice < 0) {
      toast({
        title: "Error",
        description: "Price cannot be negative",
        variant: "destructive"
      });
      return false;
    }
    
    if (tierCapacity !== null && tierCapacity <= 0) {
      toast({
        title: "Error",
        description: "Capacity must be greater than zero",
        variant: "destructive"
      });
      return false;
    }
    
    if (tierStartDate && tierEndDate && tierStartDate > tierEndDate) {
      toast({
        title: "Error",
        description: "Start date cannot be after end date",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Handle save
  const handleSaveTier = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Create the tier object
      const tierData: Partial<PricingTier> = {
        name: tierName,
        description: tierDescription || null,
        price: tierPrice,
        capacity: tierCapacity,
        startDate: tierStartDate,
        endDate: tierEndDate,
        isActive: tierIsActive
      };
      
      // If we're editing, update the existing tier
      if (editingTier) {
        if (eventId) {
          // Update via API
          const response = await fetch(`/api/events/${eventId}/pricing/tiers/${editingTier.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tierData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to update pricing tier');
          }
          
          const { tier } = await response.json();
          
          // Update the tier in the local state
          const updatedTiers = pricingTiers.map(t => 
            t.id === editingTier.id ? tier : t
          );
          
          setPricingTiers(updatedTiers);
          
          if (onChange) {
            onChange(updatedTiers);
          }
        } else {
          // Update local state only
          const updatedTiers = pricingTiers.map(t => 
            t.id === editingTier.id ? { ...t, ...tierData } : t
          );
          
          setPricingTiers(updatedTiers);
          
          if (onChange) {
            onChange(updatedTiers);
          }
        }
        
        toast({
          title: "Success",
          description: "Pricing tier updated",
          variant: "default"
        });
      } else {
        // We're adding a new tier
        if (eventId) {
          // Add via API
          const response = await fetch(`/api/events/${eventId}/pricing/tiers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tierData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to create pricing tier');
          }
          
          const { tier } = await response.json();
          
          // Add the new tier to the local state
          const updatedTiers = [...pricingTiers, tier];
          setPricingTiers(updatedTiers);
          
          if (onChange) {
            onChange(updatedTiers);
          }
        } else {
          // Add to local state only with a temporary ID
          const tempTier: PricingTier = {
            id: `temp-${Date.now()}`,
            eventId: eventId || '',
            name: tierName,
            description: tierDescription || null,
            price: tierPrice,
            capacity: tierCapacity,
            startDate: tierStartDate,
            endDate: tierEndDate,
            isActive: tierIsActive,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const updatedTiers = [...pricingTiers, tempTier];
          setPricingTiers(updatedTiers);
          
          if (onChange) {
            onChange(updatedTiers);
          }
        }
        
        toast({
          title: "Success",
          description: "Pricing tier added",
          variant: "default"
        });
      }
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving pricing tier:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete
  const handleDeleteTier = async (tierId: string) => {
    try {
      setIsLoading(true);
      
      if (eventId) {
        // Delete via API
        const response = await fetch(`/api/events/${eventId}/pricing/tiers/${tierId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete pricing tier');
        }
      }
      
      // Update local state
      const updatedTiers = pricingTiers.filter(t => t.id !== tierId);
      setPricingTiers(updatedTiers);
      
      if (onChange) {
        onChange(updatedTiers);
      }
      
      toast({
        title: "Success",
        description: "Pricing tier deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting pricing tier:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency || 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };
  
  // Read-only view
  if (!isEditMode) {
    if (pricingTiers.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 space-y-4">
        <h3 className="text-lg font-semibold">Pricing Tiers</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map(tier => (
            <Card key={tier.id} className={cn(!tier.isActive && "opacity-60")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{tier.name}</CardTitle>
                {!tier.isActive && <span className="text-xs text-muted-foreground">Inactive</span>}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(tier.price)}</div>
                {tier.description && <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>}
                
                <div className="mt-3 space-y-2">
                  {tier.capacity && (
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Limited to {tier.capacity} attendees</span>
                    </div>
                  )}
                  
                  {(tier.startDate || tier.endDate) && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {tier.startDate && format(new Date(tier.startDate), 'PPP')}
                        {tier.startDate && tier.endDate && " - "}
                        {tier.endDate && format(new Date(tier.endDate), 'PPP')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Edit mode
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pricing Tiers</h3>
        <Button size="sm" onClick={handleAddTier}>
          <Plus className="mr-1 h-4 w-4" /> Add Tier
        </Button>
      </div>
      
      {pricingTiers.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">No pricing tiers defined yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add tiers to provide different pricing options for your event.
          </p>
          <Button className="mt-4" onClick={handleAddTier}>
            <Plus className="mr-1 h-4 w-4" /> Add Your First Tier
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pricingTiers.map(tier => (
            <Card key={tier.id} className={cn(!tier.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{tier.name}</h4>
                    <div className="text-lg font-semibold">{formatCurrency(tier.price)}</div>
                    {tier.description && (
                      <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    )}
                    
                    <div className="mt-2 space-y-1">
                      {tier.capacity && (
                        <div className="flex items-center text-sm">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Limited to {tier.capacity} attendees</span>
                        </div>
                      )}
                      
                      {(tier.startDate || tier.endDate) && (
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            {tier.startDate && format(new Date(tier.startDate), 'PPP')}
                            {tier.startDate && tier.endDate && " - "}
                            {tier.endDate && format(new Date(tier.endDate), 'PPP')}
                          </span>
                        </div>
                      )}
                      
                      {!tier.isActive && (
                        <div className="text-sm text-muted-foreground mt-1">Status: Inactive</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTier(tier)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Tier Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Pricing Tier' : 'Add Pricing Tier'}
            </DialogTitle>
            <DialogDescription>
              Define pricing options for attendees. You can create tiers for early bird pricing, VIP access, or standard admission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tierName">Tier Name *</Label>
              <Input
                id="tierName"
                placeholder="Early Bird, VIP, Standard, etc."
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tierPrice">Price ({baseCurrency || 'USD'}) *</Label>
              <Input
                id="tierPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={tierPrice / 100}
                onChange={(e) => setTierPrice(Math.round(parseFloat(e.target.value) * 100))}
              />
              <p className="text-xs text-muted-foreground">
                Enter the price for this tier.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tierDescription">Description</Label>
              <Textarea
                id="tierDescription"
                placeholder="What's included in this ticket tier..."
                value={tierDescription}
                onChange={(e) => setTierDescription(e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="tierCapacity">Capacity Limit</Label>
              <Input
                id="tierCapacity"
                type="number"
                min="1"
                placeholder="No limit"
                value={tierCapacity === null ? '' : tierCapacity}
                onChange={(e) => setTierCapacity(e.target.value ? parseInt(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: limit the number of tickets available at this price.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {tierStartDate ? format(tierStartDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={tierStartDate || undefined}
                      onSelect={(date) => setTierStartDate(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="block mb-2">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {tierEndDate ? format(tierEndDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={tierEndDate || undefined}
                      onSelect={(date) => setTierEndDate(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="tierIsActive"
                checked={tierIsActive}
                onCheckedChange={setTierIsActive}
              />
              <Label htmlFor="tierIsActive">Tier is active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTier} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {editingTier ? 'Update' : 'Add'} Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 