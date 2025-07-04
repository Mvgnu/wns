'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserX, UserCog, Shield, User, EyeOffIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Member {
  id: string;
  name: string;
  email: string;
  image: string;
  role: 'admin' | 'member';
  isAnonymous?: boolean;
}

interface ManageMembersDialogProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onMembersChange?: () => void;
}

export default function ManageMembersDialog({
  groupId,
  isOpen,
  onClose,
  onMembersChange
}: ManageMembersDialogProps) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  // Fetch members when dialog opens
  useEffect(() => {
    if (isOpen && groupId) {
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Fehler',
        description: 'Mitglieder konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Möchtest du dieses Mitglied wirklich entfernen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      
      // Update the local state
      setMembers(members.filter(member => member.id !== memberId));
      
      toast({
        title: 'Erfolg',
        description: 'Mitglied wurde entfernt',
        variant: 'default',
      });
      
      // Notify parent component
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Fehler',
        description: 'Mitglied konnte nicht entfernt werden',
        variant: 'destructive',
      });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change role');
      }
      
      // Update the local state
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
      
      toast({
        title: 'Erfolg',
        description: `Rolle wurde zu ${newRole === 'admin' ? 'Administrator' : 'Mitglied'} geändert`,
        variant: 'default',
      });
      
      // Notify parent component
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht geändert werden',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAnonymity = async (memberId: string, isCurrentlyAnonymous: boolean) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}/anonymity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAnonymous: !isCurrentlyAnonymous }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update anonymity');
      }
      
      // Update the local state
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, isAnonymous: !isCurrentlyAnonymous } : member
      ));
      
      toast({
        title: 'Erfolg',
        description: `Mitglied ist jetzt ${!isCurrentlyAnonymous ? 'anonym' : 'öffentlich sichtbar'}`,
        variant: 'default',
      });
      
      // Notify parent component
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (error) {
      console.error('Error changing anonymity:', error);
      toast({
        title: 'Fehler',
        description: 'Anonymitätsstatus konnte nicht geändert werden',
        variant: 'destructive',
      });
    }
  };

  // Check if current user is an admin
  const isCurrentUserAdmin = members.some(
    member => member.id === session?.user?.id && member.role === 'admin'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gruppenmitglieder verwalten</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Mitglieder ({members.length})</TabsTrigger>
            <TabsTrigger value="admins">Administratoren ({members.filter(m => m.role === 'admin').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">Lädt...</div>
            ) : members.length === 0 ? (
              <div className="text-center p-4 text-gray-500">Keine Mitglieder gefunden</div>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center">
                          {member.name}
                          {member.isAnonymous && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 flex items-center">
                              <EyeOffIcon className="h-3 w-3 mr-1" />
                              Anonym
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {member.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3" />
                              Administrator
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              Mitglied
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isCurrentUserAdmin && member.id !== session?.user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === 'member' ? (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>Zum Administrator machen</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                              <User className="mr-2 h-4 w-4" />
                              <span>Zum Mitglied machen</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => handleToggleAnonymity(member.id, !!member.isAnonymous)}
                          >
                            <EyeOffIcon className="mr-2 h-4 w-4" />
                            <span>
                              {member.isAnonymous ? 'Sichtbar machen' : 'Anonym machen'}
                            </span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Entfernen</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="admins" className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">Lädt...</div>
            ) : members.filter(m => m.role === 'admin').length === 0 ? (
              <div className="text-center p-4 text-gray-500">Keine Administratoren gefunden</div>
            ) : (
              <div className="space-y-2">
                {members
                  .filter(member => member.role === 'admin')
                  .map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Administrator
                          </div>
                        </div>
                      </div>
                      
                      {isCurrentUserAdmin && member.id !== session?.user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                              <User className="mr-2 h-4 w-4" />
                              <span>Zum Mitglied machen</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              <span>Entfernen</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 