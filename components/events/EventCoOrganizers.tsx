'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, X, UserPlus, CheckCircle, Settings, Shield, ChevronDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EventOrganizer {
  id: string;
  userId: string;
  eventId: string;
  role: string;
  permissions: string[];
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

interface EventCoOrganizersProps {
  eventId: string;
  isEditMode: boolean;
  isOwner: boolean;
  onChange?: (organizers: EventOrganizer[]) => void;
}

export function EventCoOrganizers({
  eventId,
  isEditMode,
  isOwner,
  onChange
}: EventCoOrganizersProps) {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState<EventOrganizer[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('assistant');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['view-analytics']);
  const [showPermissions, setShowPermissions] = useState(false);
  
  // Define available roles and permissions
  const roles = [
    { value: 'co-host', label: 'Co-Host', description: 'Can modify most event details' },
    { value: 'assistant', label: 'Assistant', description: 'Helps with specific tasks' },
    { value: 'moderator', label: 'Moderator', description: 'Manages attendees and discussions' },
    { value: 'support', label: 'Support', description: 'Limited access for support staff' }
  ];
  
  const permissions = [
    { value: 'edit', label: 'Edit Event Details', description: 'Can edit basic event information' },
    { value: 'delete', label: 'Delete', description: 'Can delete the event' },
    { value: 'manage-attendees', label: 'Manage Attendees', description: 'Can approve/reject/remove attendees' },
    { value: 'view-analytics', label: 'View Analytics', description: 'Can view event statistics' },
    { value: 'manage-communications', label: 'Manage Communications', description: 'Can send announcements to attendees' },
    { value: 'manage-schedule', label: 'Manage Schedule', description: 'Can modify event schedule' }
  ];
  
  // Default permissions per role
  const defaultPermissionsByRole: Record<string, string[]> = {
    'co-host': ['edit', 'manage-attendees', 'view-analytics', 'manage-communications', 'manage-schedule'],
    'assistant': ['view-analytics', 'manage-schedule'],
    'moderator': ['manage-attendees', 'view-analytics'],
    'support': ['view-analytics']
  };
  
  // Get role label
  const getRoleLabel = (role: string) => {
    return roles.find(r => r.value === role)?.label || role;
  };
  
  // Get permission label
  const getPermissionLabel = (permission: string) => {
    return permissions.find(p => p.value === permission)?.label || permission;
  };
  
  // Get initial organizers
  useEffect(() => {
    if (eventId) {
      fetchOrganizers();
    }
  }, [eventId]);
  
  // Update permissions when role changes
  useEffect(() => {
    setSelectedPermissions(defaultPermissionsByRole[selectedRole] || []);
  }, [selectedRole]);
  
  // Fetch organizers from the API
  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/organizers`);
      if (!response.ok) throw new Error('Failed to fetch organizers');
      
      const data = await response.json();
      setOrganizers(data.organizers || []);
      
      // Call onChange if provided
      if (onChange) {
        onChange(data.organizers || []);
      }
      
    } catch (error) {
      console.error('Error fetching organizers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Add a co-organizer
  const addCoOrganizer = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/organizers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
          permissions: selectedPermissions,
          notifyUser: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add co-organizer');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Co-organizer added successfully',
        variant: 'default'
      });
      
      // Reset form and close dialog
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddDialog(false);
      
      // Refresh organizers list
      fetchOrganizers();
      
    } catch (error) {
      console.error('Error adding co-organizer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add co-organizer',
        variant: 'destructive'
      });
    }
  };
  
  // Remove a co-organizer
  const removeCoOrganizer = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/organizers/${deleteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove co-organizer');
      }
      
      toast({
        title: 'Success',
        description: 'Co-organizer removed successfully',
        variant: 'default'
      });
      
      // Reset and close dialog
      setDeleteId(null);
      setShowDeleteDialog(false);
      
      // Refresh organizers list
      fetchOrganizers();
      
    } catch (error) {
      console.error('Error removing co-organizer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove co-organizer',
        variant: 'destructive'
      });
    }
  };
  
  // Search for users to add as co-organizers
  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search users');
      
      const data = await response.json();
      
      // Filter out users who are already organizers
      const existingUserIds = organizers.map(org => org.userId);
      const filteredResults = data.users.filter((user: any) => !existingUserIds.includes(user.id));
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Toggle permission selection
  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  // Get avatar initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Event Team
        </CardTitle>
        <CardDescription>
          Manage who can help organize and run this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {organizers.length > 0 ? (
              <div className="space-y-3">
                {organizers.map((organizer) => (
                  <div 
                    key={organizer.id} 
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={organizer.image || undefined} alt={organizer.name} />
                        <AvatarFallback>{getInitials(organizer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{organizer.name}</div>
                        <div className="text-sm text-muted-foreground">{organizer.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={organizer.role === 'owner' ? 'default' : 'secondary'}
                      >
                        {organizer.role === 'owner' ? 'Owner' : getRoleLabel(organizer.role)}
                      </Badge>
                      
                      {isEditMode && isOwner && organizer.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex gap-2 items-center cursor-pointer"
                              onClick={() => {
                                // Implement edit functionality
                                toast({
                                  title: 'Coming Soon',
                                  description: 'Edit functionality will be available soon',
                                  variant: 'default'
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit Role</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex gap-2 items-center text-destructive cursor-pointer"
                              onClick={() => {
                                setDeleteId(organizer.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Remove</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                No co-organizers added yet
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {isEditMode && (isOwner || organizers.some(org => 
        org.userId === 'currentUserId' && org.role === 'co-host' && org.permissions.includes('edit'))) && (
        <CardFooter>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add someone to help manage this event
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!selectedUser ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search for a user</Label>
                      <Input
                        id="search"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {searching && (
                      <div className="flex justify-center py-2">
                        <Spinner size="sm" />
                      </div>
                    )}
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Avatar>
                              <AvatarImage src={user.image || undefined} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchQuery.trim().length >= 3 && searchResults.length === 0 && !searching && (
                      <div className="text-center py-2 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={selectedUser.image || undefined} alt={selectedUser.name} />
                          <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedUser.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <span>{role.label}</span>
                                <p className="text-xs text-muted-foreground">{role.description}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permissions</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setShowPermissions(!showPermissions)}
                        >
                          {showPermissions ? 'Hide' : 'Customize'} 
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showPermissions ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                      
                      {showPermissions && (
                        <div className="space-y-2 border rounded-md p-3">
                          {permissions.map((permission) => (
                            <div key={permission.value} className="flex items-start space-x-2">
                              <Checkbox
                                id={`permission-${permission.value}`}
                                checked={selectedPermissions.includes(permission.value)}
                                onCheckedChange={() => togglePermission(permission.value)}
                              />
                              <div className="space-y-1 leading-none">
                                <label
                                  htmlFor={`permission-${permission.value}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {permission.label}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!showPermissions && (
                        <div className="flex flex-wrap gap-1">
                          {selectedPermissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {getPermissionLabel(permission)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={addCoOrganizer}
                  disabled={!selectedUser}
                >
                  Add to Team
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this person from the event team?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={removeCoOrganizer}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
} 