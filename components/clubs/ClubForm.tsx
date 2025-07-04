import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { ImageUpload } from '@/components/ui/image-upload';
import { PlaceType, PLACE_TYPE_LABELS } from '@/lib/models/places';
import { getDefaultClubSettings } from '@/lib/models/clubs';

// Validation schema
const clubSchema = z.object({
  name: z.string().min(2, { message: 'Club name must be at least 2 characters' }),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  settings: z.record(z.any()).optional(),
  locations: z.array(z.string()).optional(),
  primaryLocationId: z.string().optional(),
  sports: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: 'Sport name is required' }),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional()
  })).optional()
});

type ClubFormValues = z.infer<typeof clubSchema>;

type Location = {
  id: string;
  name: string;
  type: PlaceType;
  city?: string;
  state?: string;
};

type Sport = {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
};

interface ClubFormProps {
  defaultValues?: Partial<ClubFormValues>;
  locations?: Location[];
  onSubmit: (data: ClubFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ClubForm({ defaultValues, locations = [], onSubmit, isLoading = false }: ClubFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [sports, setSports] = useState<Sport[]>(defaultValues?.sports || []);
  const [newSport, setNewSport] = useState<Sport>({ name: '' });
  const [settingsConfig, setSettingsConfig] = useState(
    defaultValues?.settings || getDefaultClubSettings()
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: '',
      description: '',
      logo: '',
      coverImage: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
      foundedYear: undefined,
      locations: [],
      primaryLocationId: '',
      ...defaultValues
    }
  });

  useEffect(() => {
    setValue('sports', sports);
  }, [sports, setValue]);

  useEffect(() => {
    setValue('settings', settingsConfig);
  }, [settingsConfig, setValue]);

  const addSport = () => {
    if (newSport.name.trim().length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a sport name'
      });
      return;
    }
    
    setSports([...sports, { ...newSport }]);
    setNewSport({ name: '' });
  };

  const removeSport = (index: number) => {
    const updatedSports = [...sports];
    updatedSports.splice(index, 1);
    setSports(updatedSports);
  };

  const updateSetting = (key: string, value: any) => {
    setSettingsConfig({
      ...settingsConfig,
      [key]: value
    });
  };

  const handleFormSubmit = async (data: ClubFormValues) => {
    // Merge in the sports and settings before submitting
    data.sports = sports;
    data.settings = settingsConfig;
    
    try {
      await onSubmit(data);
      toast({
        variant: 'default',
        title: 'Success',
        description: 'Club has been saved'
      });
    } catch (error) {
      console.error('Error saving club:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save club. Please try again.'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{defaultValues?.name ? 'Edit Club' : 'Create New Club'}</CardTitle>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mx-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <CardContent className="p-6">
            <TabsContent value="basic">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Club Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Club Logo</Label>
                    <Controller
                      name="logo"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload Logo"
                        />
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <Controller
                      name="coverImage"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload Cover"
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    {...register('website')}
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail')}
                      className={errors.contactEmail ? 'border-red-500' : ''}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Controller
                    name="foundedYear"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="foundedYear"
                        type="number"
                        min={1800}
                        max={new Date().getFullYear()}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    )}
                  />
                  {errors.foundedYear && (
                    <p className="text-sm text-red-500">{errors.foundedYear.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="locations">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Club Locations</Label>
                  <p className="text-sm text-muted-foreground">
                    Select locations associated with this club. Buildings are typically owned by clubs,
                    while trails and spots can be associated for informational purposes.
                  </p>
                  
                  <Controller
                    name="locations"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        value={field.value || []}
                        onChange={field.onChange}
                        options={locations.map(loc => ({
                          value: loc.id,
                          label: `${loc.name} (${PLACE_TYPE_LABELS[loc.type]}${loc.city ? `, ${loc.city}` : ''})`
                        }))}
                        placeholder="Select locations..."
                      />
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryLocationId">Primary Location</Label>
                  <Controller
                    name="primaryLocationId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!register('locations').value?.length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a primary location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations
                            .filter(loc => register('locations').value?.includes(loc.id))
                            .map(loc => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name} ({PLACE_TYPE_LABELS[loc.type]})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed as the club's main address and used for map displays.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sports">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Club Sports</Label>
                  <p className="text-sm text-muted-foreground">
                    Add the sports offered by this club. For each sport, you'll be able to create
                    separate groups (like teams or classes).
                  </p>
                  
                  <div className="border rounded-md p-4">
                    <div className="space-y-4">
                      {sports.map((sport, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 border-b pb-2">
                          <div>
                            <p className="font-medium">{sport.name}</p>
                            {sport.description && (
                              <p className="text-sm text-muted-foreground">{sport.description}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSport(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-2">
                          <Input
                            placeholder="Sport name"
                            value={newSport.name}
                            onChange={(e) => setNewSport({ ...newSport, name: e.target.value })}
                          />
                        </div>
                        <Input
                          placeholder="Description (optional)"
                          value={newSport.description || ''}
                          onChange={(e) => setNewSport({ ...newSport, description: e.target.value })}
                        />
                      </div>
                      
                      <Button type="button" onClick={addSport}>
                        Add Sport
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Club Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure the default settings for this club and its groups.
                  </p>
                  
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Public Groups</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow creating public groups within this club
                        </p>
                      </div>
                      <Switch
                        checked={settingsConfig.allowPublicGroups}
                        onCheckedChange={(checked) => updateSetting('allowPublicGroups', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Member Group Creation</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow members to create groups within this club
                        </p>
                      </div>
                      <Switch
                        checked={settingsConfig.allowMembersToCreateGroups}
                        onCheckedChange={(checked) => updateSetting('allowMembersToCreateGroups', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Event Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Require approval for events created within this club
                        </p>
                      </div>
                      <Switch
                        checked={settingsConfig.requireApprovalForEvents}
                        onCheckedChange={(checked) => updateSetting('requireApprovalForEvents', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Member Invitations</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow members to invite others to join this club
                        </p>
                      </div>
                      <Switch
                        checked={settingsConfig.allowMembersToInvite}
                        onCheckedChange={(checked) => updateSetting('allowMembersToInvite', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Public Member List</Label>
                        <p className="text-sm text-muted-foreground">
                          Show the member list to all club members
                        </p>
                      </div>
                      <Switch
                        checked={settingsConfig.showMemberList}
                        onCheckedChange={(checked) => updateSetting('showMemberList', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Club'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 