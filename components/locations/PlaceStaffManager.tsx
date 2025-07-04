'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrashIcon, 
  PencilIcon, 
  PlusCircleIcon, 
  ShieldCheck, 
  Calendar, 
  Users,
  UserCog,
  Mail
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

// Types
type StaffMember = {
  id: string;
  userId: string;
  role: string;
  canEditPlace: boolean;
  canManageEvents: boolean;
  canManageStaff: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type PlaceStaffManagerProps = {
  placeId: string;
  placeName: string;
  currentUserIsOwner: boolean;
  initialStaff: StaffMember[];
};

export default function PlaceStaffManager({
  placeId,
  placeName,
  currentUserIsOwner,
  initialStaff = []
}: PlaceStaffManagerProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [canEditPlace, setCanEditPlace] = useState(false);
  const [canManageEvents, setCanManageEvents] = useState(false);
  const [canManageStaff, setCanManageStaff] = useState(false);
  
  // Refresh staff list
  const refreshStaff = async () => {
    try {
      const response = await fetch(`/api/places/${placeId}/staff`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      
      const data = await response.json();
      setStaff(data.staff);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh staff list',
        variant: 'destructive',
      });
    }
  };
  
  // Reset form
  const resetForm = () => {
    setUserEmail('');
    setRole('employee');
    setCanEditPlace(false);
    setCanManageEvents(false);
    setCanManageStaff(false);
  };
  
  // Check if current user has permission
  const hasPermission = (permission: 'canEditPlace' | 'canManageEvents' | 'canManageStaff') => {
    if (!session?.user?.id) return false;
    
    // If user is owner, they have all permissions
    if (currentUserIsOwner) return true;
    
    // Check if user has specific permission
    const userStaff = staff.find(s => s.user.id === session.user.id);
    return userStaff ? userStaff[permission] : false;
  };
  
  // Add staff member
  const addStaffMember = async () => {
    if (!userEmail || !role) {
      toast({
        title: 'Error',
        description: 'Please enter all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/places/${placeId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          role,
          canEditPlace,
          canManageEvents,
          canManageStaff,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add staff member');
      }
      
      toast({
        title: 'Success',
        description: 'Staff member added successfully',
        variant: 'default'
      });
      
      // Reset form and refresh data
      resetForm();
      setIsAddingStaff(false);
      await refreshStaff();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add staff member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update staff member
  const updateStaffMember = async (id: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/places/${placeId}/staff/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          canEditPlace,
          canManageEvents,
          canManageStaff,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update staff member');
      }
      
      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
        variant: 'default'
      });
      
      // Reset form and refresh data
      resetForm();
      setIsEditingStaff(null);
      await refreshStaff();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update staff member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove staff member
  const removeStaffMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/places/${placeId}/staff/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove staff member');
      }
      
      toast({
        title: 'Success',
        description: 'Staff member removed successfully',
        variant: 'default'
      });
      
      // Refresh data
      await refreshStaff();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove staff member',
        variant: 'destructive',
      });
    }
  };
  
  // Set up form for editing
  const startEditing = (staffMember: StaffMember) => {
    setRole(staffMember.role);
    setCanEditPlace(staffMember.canEditPlace);
    setCanManageEvents(staffMember.canManageEvents);
    setCanManageStaff(staffMember.canManageStaff);
    setIsEditingStaff(staffMember.id);
  };
  
  // Helper to get role icon
  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'owner':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'manager':
        return <UserCog className="h-4 w-4 text-green-500" />;
      case 'instructor':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'employee':
        return <Calendar className="h-4 w-4 text-gray-500" />;
      default:
        return <UserCog className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Helper to get permission status for table
  const getPermissionStatus = (has: boolean) => {
    return has ? (
      <span className="inline-flex items-center text-green-600 text-xs font-medium">
        <ShieldCheck className="h-3 w-3 mr-1" /> Yes
      </span>
    ) : (
      <span className="text-gray-400 text-xs">No</span>
    );
  };
  
  // Check if user has any permissions
  const canManageAnyStaff = currentUserIsOwner || hasPermission('canManageStaff');
  
  if (!canManageAnyStaff) {
    return (
      <div className="text-center p-4 text-gray-500">
        You don't have permission to manage staff for this place.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Manage Staff for {placeName}</h3>
        
        {(currentUserIsOwner || hasPermission('canManageStaff')) && (
          <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircleIcon className="h-4 w-4 mr-2" /> Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the user you want to add as staff.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="Enter email address"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserIsOwner && (
                        <SelectItem value="manager">Manager</SelectItem>
                      )}
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3 border rounded-md p-3">
                  <Label className="text-sm font-medium">Permissions</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canEditPlace"
                      checked={canEditPlace}
                      onCheckedChange={(checked) => setCanEditPlace(checked === true)}
                    />
                    <Label htmlFor="canEditPlace" className="text-sm font-normal">
                      Can edit place details
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canManageEvents"
                      checked={canManageEvents}
                      onCheckedChange={(checked) => setCanManageEvents(checked === true)}
                    />
                    <Label htmlFor="canManageEvents" className="text-sm font-normal">
                      Can manage events
                    </Label>
                  </div>
                  
                  {currentUserIsOwner && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canManageStaff"
                        checked={canManageStaff}
                        onCheckedChange={(checked) => setCanManageStaff(checked === true)}
                      />
                      <Label htmlFor="canManageStaff" className="text-sm font-normal">
                        Can manage staff
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingStaff(false)}>
                  Cancel
                </Button>
                <Button onClick={addStaffMember} disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Staff Member'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {staff.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-gray-50">
          <p className="text-gray-500">No staff members added yet.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Edit Place</TableHead>
                <TableHead>Manage Events</TableHead>
                <TableHead>Manage Staff</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {member.user.image ? (
                          <AvatarImage src={member.user.image} alt={member.user.name || ''} />
                        ) : (
                          <AvatarFallback>
                            {member.user.name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-xs text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPermissionStatus(member.canEditPlace)}</TableCell>
                  <TableCell>{getPermissionStatus(member.canManageEvents)}</TableCell>
                  <TableCell>{getPermissionStatus(member.canManageStaff)}</TableCell>
                  <TableCell>
                    {(currentUserIsOwner || 
                      (hasPermission('canManageStaff') && member.role !== 'owner')) && 
                      member.role !== 'owner' && (
                      <div className="flex items-center gap-2">
                        <Dialog open={isEditingStaff === member.id} onOpenChange={(open) => !open && setIsEditingStaff(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => startEditing(member)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Staff Member</DialogTitle>
                              <DialogDescription>
                                Update role and permissions for {member.user.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentUserIsOwner && (
                                      <SelectItem value="manager">Manager</SelectItem>
                                    )}
                                    <SelectItem value="instructor">Instructor</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-3 border rounded-md p-3">
                                <Label className="text-sm font-medium">Permissions</Label>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="editCanEditPlace"
                                    checked={canEditPlace}
                                    onCheckedChange={(checked) => setCanEditPlace(checked === true)}
                                  />
                                  <Label htmlFor="editCanEditPlace" className="text-sm font-normal">
                                    Can edit place details
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="editCanManageEvents"
                                    checked={canManageEvents}
                                    onCheckedChange={(checked) => setCanManageEvents(checked === true)}
                                  />
                                  <Label htmlFor="editCanManageEvents" className="text-sm font-normal">
                                    Can manage events
                                  </Label>
                                </div>
                                
                                {currentUserIsOwner && (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="editCanManageStaff"
                                      checked={canManageStaff}
                                      onCheckedChange={(checked) => setCanManageStaff(checked === true)}
                                    />
                                    <Label htmlFor="editCanManageStaff" className="text-sm font-normal">
                                      Can manage staff
                                    </Label>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditingStaff(null)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => updateStaffMember(member.id)} 
                                disabled={isLoading}
                              >
                                {isLoading ? 'Updating...' : 'Update'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeStaffMember(member.id)}
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 