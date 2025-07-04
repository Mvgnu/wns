'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, PercentIcon, DollarSign, Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { DiscountCode } from '@/lib/prisma-extensions';

interface EventDiscountCodesProps {
  eventId?: string;
  baseCurrency: string;
  existingCodes?: DiscountCode[];
  isEditMode?: boolean;
  onChange?: (codes: DiscountCode[]) => void;
}

export function EventDiscountCodes({
  eventId,
  baseCurrency,
  existingCodes = [],
  isEditMode = true,
  onChange
}: EventDiscountCodesProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(existingCodes);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  // Form state for editing a discount code
  const [codeValue, setCodeValue] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  // Update local state when props change
  useEffect(() => {
    setDiscountCodes(existingCodes);
  }, [existingCodes]);
  
  // Reset form state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  // Initialize form with code data for editing
  useEffect(() => {
    if (editingCode) {
      setCodeValue(editingCode.code);
      setDiscountType(editingCode.discountType);
      setDiscountValue(editingCode.discountValue);
      setMaxUses(editingCode.maxUses);
      setStartDate(editingCode.startDate ? new Date(editingCode.startDate) : null);
      setEndDate(editingCode.endDate ? new Date(editingCode.endDate) : null);
      setIsActive(editingCode.isActive);
    }
  }, [editingCode]);
  
  // Reset the form
  const resetForm = () => {
    setEditingCode(null);
    setCodeValue('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setMaxUses(null);
    setStartDate(null);
    setEndDate(null);
    setIsActive(true);
  };
  
  // Generate a random discount code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCodeValue(result);
  };
  
  // Open dialog for adding a new code
  const handleAddCode = () => {
    resetForm();
    generateRandomCode();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an existing code
  const handleEditCode = (code: DiscountCode) => {
    setEditingCode(code);
    setIsDialogOpen(true);
  };
  
  // Copy discount code to clipboard
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    
    toast({
      title: "Copied!",
      description: `Discount code "${code}" copied to clipboard`,
      variant: "default"
    });
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    if (!codeValue.trim()) {
      toast({
        title: "Error",
        description: "Discount code is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (discountValue <= 0) {
      toast({
        title: "Error",
        description: "Discount value must be greater than zero",
        variant: "destructive"
      });
      return false;
    }
    
    if (discountType === 'percentage' && discountValue > 100) {
      toast({
        title: "Error",
        description: "Percentage discount cannot exceed 100%",
        variant: "destructive"
      });
      return false;
    }
    
    if (maxUses !== null && maxUses <= 0) {
      toast({
        title: "Error",
        description: "Maximum uses must be greater than zero",
        variant: "destructive"
      });
      return false;
    }
    
    if (startDate && endDate && startDate > endDate) {
      toast({
        title: "Error",
        description: "Start date cannot be after end date",
        variant: "destructive"
      });
      return false;
    }
    
    // Check for duplicate codes
    const isDuplicate = discountCodes.some(c => 
      c.code.toLowerCase() === codeValue.toLowerCase() && 
      (!editingCode || c.id !== editingCode.id)
    );
    
    if (isDuplicate) {
      toast({
        title: "Error",
        description: "This discount code already exists",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Handle save
  const handleSaveCode = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Create the code object
      const codeData: Partial<DiscountCode> = {
        code: codeValue.toUpperCase(),
        discountType,
        discountValue,
        maxUses,
        startDate,
        endDate,
        isActive
      };
      
      // If we're editing, update the existing code
      if (editingCode) {
        if (eventId) {
          // Update via API
          const response = await fetch(`/api/events/${eventId}/discounts/${editingCode.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(codeData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to update discount code');
          }
          
          const { discountCode } = await response.json();
          
          // Update the code in the local state
          const updatedCodes = discountCodes.map(c => 
            c.id === editingCode.id ? discountCode : c
          );
          
          setDiscountCodes(updatedCodes);
          
          if (onChange) {
            onChange(updatedCodes);
          }
        } else {
          // Update local state only
          const updatedCodes = discountCodes.map(c => 
            c.id === editingCode.id ? { ...c, ...codeData } : c
          );
          
          setDiscountCodes(updatedCodes);
          
          if (onChange) {
            onChange(updatedCodes);
          }
        }
        
        toast({
          title: "Success",
          description: "Discount code updated",
          variant: "default"
        });
      } else {
        // We're adding a new code
        if (eventId) {
          // Add via API
          const response = await fetch(`/api/events/${eventId}/discounts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(codeData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to create discount code');
          }
          
          const { discountCode } = await response.json();
          
          // Add the new code to the local state
          const updatedCodes = [...discountCodes, discountCode];
          setDiscountCodes(updatedCodes);
          
          if (onChange) {
            onChange(updatedCodes);
          }
        } else {
          // Add to local state only with a temporary ID
          const tempCode: DiscountCode = {
            id: `temp-${Date.now()}`,
            eventId: eventId || '',
            code: codeValue.toUpperCase(),
            discountType,
            discountValue,
            maxUses,
            currentUses: 0,
            startDate,
            endDate,
            isActive,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const updatedCodes = [...discountCodes, tempCode];
          setDiscountCodes(updatedCodes);
          
          if (onChange) {
            onChange(updatedCodes);
          }
        }
        
        toast({
          title: "Success",
          description: "Discount code added",
          variant: "default"
        });
      }
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving discount code:', error);
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
  const handleDeleteCode = async (codeId: string) => {
    try {
      setIsLoading(true);
      
      if (eventId) {
        // Delete via API
        const response = await fetch(`/api/events/${eventId}/discounts/${codeId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete discount code');
        }
      }
      
      // Update local state
      const updatedCodes = discountCodes.filter(c => c.id !== codeId);
      setDiscountCodes(updatedCodes);
      
      if (onChange) {
        onChange(updatedCodes);
      }
      
      toast({
        title: "Success",
        description: "Discount code deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting discount code:', error);
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
  
  // Format discount
  const formatDiscount = (code: DiscountCode) => {
    if (code.discountType === 'percentage') {
      return `${code.discountValue}% off`;
    } else {
      return `${formatCurrency(code.discountValue)} off`;
    }
  };
  
  // Read-only view
  if (!isEditMode) {
    if (discountCodes.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 space-y-4">
        <h3 className="text-lg font-semibold">Available Discount Codes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discountCodes.map(code => (
            <Card key={code.id} className={cn(!code.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded">{code.code}</div>
                  {!code.isActive && <span className="text-xs text-muted-foreground">Inactive</span>}
                </div>
                
                <div className="mt-2">
                  <div className="flex items-center">
                    {code.discountType === 'percentage' ? (
                      <PercentIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold">{formatDiscount(code)}</span>
                  </div>
                  
                  {code.maxUses && (
                    <div className="text-sm mt-1">
                      Uses: {code.currentUses} / {code.maxUses}
                    </div>
                  )}
                  
                  {(code.startDate || code.endDate) && (
                    <div className="flex items-center text-sm mt-1">
                      <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>
                        {code.startDate && format(new Date(code.startDate), 'MMM d, yyyy')}
                        {code.startDate && code.endDate && " - "}
                        {code.endDate && format(new Date(code.endDate), 'MMM d, yyyy')}
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
        <h3 className="text-lg font-semibold">Discount Codes</h3>
        <Button size="sm" onClick={handleAddCode}>
          <Plus className="mr-1 h-4 w-4" /> Add Code
        </Button>
      </div>
      
      {discountCodes.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">No discount codes defined yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add discount codes to offer special pricing for your event.
          </p>
          <Button className="mt-4" onClick={handleAddCode}>
            <Plus className="mr-1 h-4 w-4" /> Add Your First Discount Code
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {discountCodes.map(code => (
            <Card key={code.id} className={cn(!code.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <div className="font-mono text-sm bg-muted px-2 py-1 rounded">{code.code}</div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 ml-1"
                        onClick={() => handleCopyCode(code.code, code.id)}
                      >
                        {copiedCodeId === code.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {!code.isActive && (
                        <span className="text-xs text-muted-foreground ml-2">Inactive</span>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center">
                        {code.discountType === 'percentage' ? (
                          <PercentIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold">{formatDiscount(code)}</span>
                      </div>
                      
                      {code.maxUses && (
                        <div className="text-sm mt-1">
                          Uses: {code.currentUses} / {code.maxUses}
                        </div>
                      )}
                      
                      {(code.startDate || code.endDate) && (
                        <div className="flex items-center text-sm mt-1">
                          <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>
                            {code.startDate && format(new Date(code.startDate), 'MMM d, yyyy')}
                            {code.startDate && code.endDate && " - "}
                            {code.endDate && format(new Date(code.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCode(code)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCode(code.id)}
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
      
      {/* Discount Code Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Discount Code' : 'Add Discount Code'}
            </DialogTitle>
            <DialogDescription>
              Create discount codes for your event. Attendees can enter these codes during registration for special pricing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="codeValue">Discount Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="codeValue"
                  placeholder="e.g., EARLYBIRD, VIP20"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomCode}
                >
                  Generate
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  {discountType === 'percentage' ? 'Percentage (%)' : `Amount (${baseCurrency || 'USD'})`} *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  max={discountType === 'percentage' ? 100 : undefined}
                  step={discountType === 'percentage' ? 1 : 0.01}
                  value={discountType === 'percentage' ? discountValue : discountValue / 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value)) return;
                    
                    if (discountType === 'percentage') {
                      setDiscountValue(value);
                    } else {
                      setDiscountValue(Math.round(value * 100));
                    }
                  }}
                  placeholder={discountType === 'percentage' ? '10' : '5.00'}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxUses">Maximum Number of Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="No limit"
                value={maxUses === null ? '' : maxUses}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: limit how many times this code can be used.
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Valid From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={(date) => setStartDate(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="block mb-2">Valid Until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={(date) => setEndDate(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Code is active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCode} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {editingCode ? 'Update' : 'Add'} Discount Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 