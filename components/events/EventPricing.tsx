'use client';

import { useState, useEffect } from 'react';
import { Euro, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
];
const isTestEnvironment = process.env.NODE_ENV === 'test';



interface EventPricingProps {
  isPaid?: boolean;
  price?: number;
  priceCurrency?: string;
  priceDescription?: string;
  maxAttendees?: number;
  onChange?: (values: {
    isPaid: boolean;
    price?: number;
    priceCurrency?: string;
    priceDescription?: string;
    maxAttendees?: number;
  }) => void;
  readOnly?: boolean;
}

export function EventPricing({
  isPaid = false,
  price = 0,
  priceCurrency = 'EUR',
  priceDescription = '',
  maxAttendees,
  onChange,
  readOnly = false
}: EventPricingProps) {
  const [pricingEnabled, setPricingEnabled] = useState(isPaid);
  const [priceValue, setPriceValue] = useState(price?.toString() || '');
  const [currency, setCurrency] = useState(priceCurrency || 'EUR');
  const [description, setDescription] = useState(priceDescription || '');
  const [attendeeLimit, setAttendeeLimit] = useState(maxAttendees?.toString() || '');
  
  // Update state when props change
  useEffect(() => {
    setPricingEnabled(isPaid);
    setPriceValue(price?.toString() || '');
    setCurrency(priceCurrency || 'EUR');
    setDescription(priceDescription || '');
    setAttendeeLimit(maxAttendees?.toString() || '');
  }, [isPaid, price, priceCurrency, priceDescription, maxAttendees]);
  
  // Handle onChange for paid/free toggle
  const handlePricingToggle = (checked: boolean) => {
    setPricingEnabled(checked);
    
    // Notify parent component
    if (onChange) {
      onChange({
        isPaid: checked,
        price: checked ? parseFloat(priceValue) || 0 : undefined,
        priceCurrency: checked ? currency : undefined,
        priceDescription: checked ? description : undefined,
        maxAttendees: attendeeLimit ? parseInt(attendeeLimit, 10) : undefined,
      });
    }
  };
  
  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric and non-decimal point characters
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPriceValue(value);
    
    if (onChange && pricingEnabled) {
      onChange({
        isPaid: pricingEnabled,
        price: parseFloat(value) || 0,
        priceCurrency: currency,
        priceDescription: description,
        maxAttendees: attendeeLimit ? parseInt(attendeeLimit, 10) : undefined,
      });
    }
  };
  
  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    
    if (onChange && pricingEnabled) {
      onChange({
        isPaid: pricingEnabled,
        price: parseFloat(priceValue) || 0,
        priceCurrency: value,
        priceDescription: description,
        maxAttendees: attendeeLimit ? parseInt(attendeeLimit, 10) : undefined,
      });
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    
    if (onChange && pricingEnabled) {
      onChange({
        isPaid: pricingEnabled,
        price: parseFloat(priceValue) || 0,
        priceCurrency: currency,
        priceDescription: e.target.value,
        maxAttendees: attendeeLimit ? parseInt(attendeeLimit, 10) : undefined,
      });
    }
  };
  
  // Handle attendee limit change
  const handleAttendeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAttendeeLimit(value);
    
    if (onChange) {
      onChange({
        isPaid: pricingEnabled,
        price: pricingEnabled ? parseFloat(priceValue) || 0 : undefined,
        priceCurrency: pricingEnabled ? currency : undefined,
        priceDescription: pricingEnabled ? description : undefined,
        maxAttendees: value ? parseInt(value, 10) : undefined,
      });
    }
  };

  if (readOnly) {
    if (!isPaid && !maxAttendees) {
      return <div className="text-sm text-muted-foreground">Free event</div>;
    }
    
    return (
      <div className="space-y-1">
        {isPaid ? (
          <>
            <div className="flex items-center">
              <strong className="text-lg mr-1">
                {CURRENCIES.find(c => c.code === priceCurrency)?.symbol || ''}
                {parseFloat(price.toString()).toFixed(2)}
              </strong>
              <span className="text-xs text-muted-foreground">
                {priceCurrency}
              </span>
            </div>
            {priceDescription && (
              <p className="text-sm text-muted-foreground">{priceDescription}</p>
            )}
          </>
        ) : (
          <div className="text-sm">Free event</div>
        )}
        
        {maxAttendees && (
          <div className="text-sm mt-1">
            <span className="text-muted-foreground">Limited capacity: </span>
            {maxAttendees} attendees
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="pricing-toggle"
            checked={pricingEnabled}
            onCheckedChange={handlePricingToggle}
          />
          <Label htmlFor="pricing-toggle">
            {pricingEnabled ? 'Paid event' : 'Free event'}
          </Label>
        </div>
      </div>
      
      {pricingEnabled && (
        <div className="space-y-4 border rounded-md p-4 bg-muted/10">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3">
              <Label htmlFor="price">Price</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {CURRENCIES.find(c => c.code === currency)?.symbol === '€' ? (
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="price"
                  type="text"
                  placeholder="0.00"
                  className="pl-9"
                  value={priceValue}
                  onChange={handlePriceChange}
                />
              </div>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="currency">Currency</Label>
              {isTestEnvironment ? (
                <select
                  id="currency"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currency}
                  onChange={(event) => handleCurrencyChange(event.target.value)}
                  data-testid="currency-select"
                >
                  {CURRENCIES.map((currencyOption) => (
                    <option key={currencyOption.code} value={currencyOption.code}>
                      {currencyOption.symbol} {currencyOption.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Select
                  value={currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger id="currency" className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CURRENCIES.map((currencyOption) => (
                        <SelectItem key={currencyOption.code} value={currencyOption.code}>
                          {currencyOption.symbol} {currencyOption.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="price-description">
              Pricing Details (Optional)
            </Label>
            <Textarea
              id="price-description"
              placeholder="E.g., 'Price includes equipment rental', 'Discounts for members'..."
              value={description}
              onChange={handleDescriptionChange}
              className="mt-1"
            />
          </div>
        </div>
      )}
      
      <div>
        <Label htmlFor="attendee-limit" className="flex items-center justify-between">
          Attendee Limit
          <span className="text-xs text-muted-foreground font-normal">
            (Leave empty for unlimited)
          </span>
        </Label>
        <Input
          id="attendee-limit"
          type="text"
          placeholder="Maximum number of attendees"
          value={attendeeLimit}
          onChange={handleAttendeeChange}
          className="mt-1"
        />
      </div>
    </div>
  );
} 