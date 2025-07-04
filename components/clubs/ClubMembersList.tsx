'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Search, UserPlus, X, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClubMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    email: string | null;
  };
  roles: {
    id: string;
    role: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  joinedAt: string;
}

interface ClubRole {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  permissions: string[];
  isDefault: boolean;
}

interface ClubMembersListProps {
  clubId: string;
  isAdmin: boolean;
}

export default function ClubMembersList({ clubId, isAdmin }: ClubMembersListProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  // State management
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [roles, setRoles] = useState<ClubRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const debouncedUserSearchQuery = useDebounce(userSearchQuery, 300);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch club members
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/clubs/${clubId}/members?search=${debouncedSearchQuery}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch club members');
        }
        
        const data = await response.json();
        setMembers(data.members);
      } catch (err) {
        setError('Error loading members. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [clubId, debouncedSearchQuery]);
  
  // Fetch club roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`/api/clubs/${clubId}/roles`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch club roles');
        }
        
        const data = await response.json();
        setRoles(data.roles);
      } catch (err) {
        console.error(err);
        // We don't set the main error state here to still allow viewing members
        toast({
          title: "Error loading roles",
          description: "Unable to load role information. Some features may be limited.",
          variant: "destructive",
        });
      }
    };
    
    if (isAdmin) {
      fetchRoles();
    }
  }, [clubId, isAdmin, toast]);
  
  // Search for users to add to the club
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedUserSearchQuery || debouncedUserSearchQuery.length < 2) {
        setUserSearchResults([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/users/search?q=${debouncedUserSearchQuery}`);
        
        if (!response.ok) {
          throw new Error('Failed to search users');
        }
        
        const data = await response.json();
        
        // Filter out users who are already members
        const filteredResults = data.users.filter(
          (user: any) => !members.some(member => member.userId === user.id)
        );
        
        setUserSearchResults(filteredResults);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error searching users",
          description: "Failed to search for users. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    if (isAdmin && addMemberDialogOpen) {
      searchUsers();
    }
  }, [debouncedUserSearchQuery, addMemberDialogOpen, members, isAdmin, toast]);
  
  // Handle adding a member
  const handleAddMember = async (userId: string) => {
    setIsSubmitting(true);
    
    try {
      const defaultRoleId = roles.find(role => role.isDefault)?.id || roles[0]?.id;
      if (!defaultRoleId) {
        throw new Error('No default role found');
      }
      
      const response = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId: defaultRoleId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add member');
      }
      
      const data = await response.json();
      setMembers(prev => [...prev, data.member]);
      setAddMemberDialogOpen(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
      
      toast({
        title: "Member added",
        description: "The user has been added to the club successfully.",
        variant: "default",
      });
      
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error adding member",
        description: "Failed to add the user to the club. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/members/${selectedMember.userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      
      setMembers(prev => prev.filter(member => member.userId !== selectedMember.userId));
      setRemoveMemberDialogOpen(false);
      setSelectedMember(null);
      
      toast({
        title: "Member removed",
        description: "The user has been removed from the club.",
        variant: "default",
      });
      
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error removing member",
        description: "Failed to remove the user from the club. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle updating member role
  const handleUpdateRole = async () => {
    if (!selectedMember || !selectedRoleId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/members/${selectedMember.userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: selectedRoleId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update member role');
      }
      
      const data = await response.json();
      
      // Update the member roles in state
      setMembers(prev => 
        prev.map(member => 
          member.userId === selectedMember.userId 
            ? { ...member, roles: [{ id: data.memberRole.id, role: data.role }] } 
            : member
        )
      );
      
      setEditRoleDialogOpen(false);
      setSelectedMember(null);
      setSelectedRoleId('');
      
      toast({
        title: "Role updated",
        description: `The member's role has been updated to ${data.role.name}.`,
        variant: "default",
      });
      
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error updating role",
        description: "Failed to update the member's role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditRoleDialog = (member: ClubMember) => {
    setSelectedMember(member);
    setSelectedRoleId(member.roles[0]?.role.id || '');
    setEditRoleDialogOpen(true);
  };
  
  const filteredMembers = members.filter(member => 
    member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Club Members</CardTitle>
        <CardDescription>
          Manage members and assign roles
        </CardDescription>
        
        <div className="flex items-center justify-between mt-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => setAddMemberDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Loading members...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchQuery ? "No members found matching your search" : "No members in this club yet"}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-4">
              {filteredMembers.map((member) => (
                <div 
                  key={member.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.image || ''} alt={member.user.name || 'Member'} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-medium">{member.user.name}</div>
                      <div className="text-sm text-muted-foreground">{member.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {member.roles.map((memberRole) => (
                      <Badge key={memberRole.id} style={{ backgroundColor: memberRole.role.color || undefined }} variant="outline" className="mr-2">
                        {memberRole.role.name}
                      </Badge>
                    ))}
                    
                    {isAdmin && (
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditRoleDialog(member)}
                          className="mr-1"
                        >
                          Edit Role
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedMember(member);
                            setRemoveMemberDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {isAdmin && (
        <>
          {/* Add Member Dialog */}
          <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member to Club</DialogTitle>
                <DialogDescription>
                  Search for users to add to this club
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-[200px] border rounded-md">
                  {userSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {userSearchQuery.length < 2
                        ? "Type at least 2 characters to search"
                        : "No users found"}
                    </div>
                  ) : (
                    <div className="p-1">
                      {userSearchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => handleAddMember(user.id)}
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-2">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            disabled={isSubmitting}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Remove Member Confirmation Dialog */}
          <Dialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this member from the club?
                </DialogDescription>
              </DialogHeader>
              
              {selectedMember && (
                <div className="flex items-center p-2 my-4 border rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMember.user.image || ''} alt={selectedMember.user.name || 'Member'} />
                    <AvatarFallback>
                      {selectedMember.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="font-medium">{selectedMember.user.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedMember.user.email}</div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setRemoveMemberDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveMember}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Removing..." : "Remove Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Role Dialog */}
          <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Member Role</DialogTitle>
                <DialogDescription>
                  Update the role for this member
                </DialogDescription>
              </DialogHeader>
              
              {selectedMember && (
                <div className="space-y-4">
                  <div className="flex items-center p-2 border rounded-md">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedMember.user.image || ''} alt={selectedMember.user.name || 'Member'} />
                      <AvatarFallback>
                        {selectedMember.user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-medium">{selectedMember.user.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedMember.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={selectedRoleId} 
                      onValueChange={setSelectedRoleId}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateRole}
                  disabled={isSubmitting || !selectedRoleId}
                >
                  {isSubmitting ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
} 