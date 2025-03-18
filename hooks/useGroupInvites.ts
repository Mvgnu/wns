import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

interface GroupInvite {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  group: {
    id: string;
    name: string;
    image: string | null;
    _count?: {
      members: number;
    };
  };
  invitedBy: {
    id: string;
    name: string;
    image: string | null;
  };
}

// Fetch invites (received or sent)
const fetchInvites = async (type: 'received' | 'sent' = 'received'): Promise<GroupInvite[]> => {
  const response = await fetch(`/api/groups/invites?type=${type}`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to fetch invites");
  }
  
  const data = await response.json();
  return data.invites || [];
};

// Generate an invite link
const generateInviteLink = async (groupId: string): Promise<string> => {
  const response = await fetch('/api/groups/invites', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ groupId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate invite link");
  }
  
  const data = await response.json();
  return data.inviteUrl;
};

// Send an invite to a user
const sendInvite = async ({ 
  groupId, 
  invitedUserId 
}: { 
  groupId: string; 
  invitedUserId: string; 
}): Promise<GroupInvite> => {
  const response = await fetch('/api/groups/invites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      groupId,
      invitedUserId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send invite");
  }
  
  return response.json();
};

// Respond to an invite (accept/reject)
const respondToInvite = async ({ 
  inviteId, 
  status 
}: { 
  inviteId: string; 
  status: 'accepted' | 'rejected'; 
}): Promise<GroupInvite> => {
  const response = await fetch('/api/groups/invites', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inviteId,
      status,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to respond to invite");
  }
  
  return response.json();
};

// Hook to fetch group invites
export function useGroupInvites(type: 'received' | 'sent' = 'received') {
  return useQuery({
    queryKey: ['group-invites', type],
    queryFn: () => fetchInvites(type),
  });
}

// Hook to generate an invite link
export function useGenerateInviteLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generateInviteLink,
    onSuccess: () => {
      toast({
        title: "Invite link generated",
        description: "A new invite link has been created for your group",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate invite link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to send an invite
export function useSendInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      toast({
        title: "Invite sent",
        description: "Your invitation has been sent",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to respond to an invite
export function useRespondToInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: respondToInvite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      
      const action = data.status === 'accepted' ? 'accepted' : 'declined';
      
      toast({
        title: `Invite ${action}`,
        description: `You have ${action} the group invitation`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to respond to invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
} 