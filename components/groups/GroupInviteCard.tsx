"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface GroupInviteCardProps {
  invite: {
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
  };
}

export default function GroupInviteCard({ invite }: GroupInviteCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(invite.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleResponse = async (response: 'accepted' | 'rejected') => {
    if (status !== 'pending') return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/groups/invites', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: invite.id,
          status: response,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to respond to invite');
      }

      setStatus(response);
      
      // Show success message
      toast({
        title: response === 'accepted' ? 'Invite Accepted' : 'Invite Declined',
        description: response === 'accepted' 
          ? `You have joined ${invite.group.name}`
          : `You have declined the invitation to ${invite.group.name}`,
        variant: 'default',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      
      // Redirect to group page if accepted
      if (response === 'accepted') {
        router.push(`/groups/${invite.group.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = invite.expiresAt && new Date() > new Date(invite.expiresAt);
  const isPending = status === 'pending' && !isExpired;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10">
              {invite.group.image && (
                <img src={invite.group.image} alt={invite.group.name} />
              )}
              {!invite.group.image && (
                <Users className="h-6 w-6" />
              )}
            </Avatar>
            <div>
              <CardTitle className="text-lg">{invite.group.name}</CardTitle>
              <CardDescription>
                Invited by {invite.invitedBy.name || 'Someone'} • {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          {invite.group._count?.members || 0} members
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        {isPending ? (
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => handleResponse('accepted')}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
            <Button
              onClick={() => handleResponse('rejected')}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Decline
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full text-center text-sm font-medium">
            {status === 'accepted' ? (
              <span className="text-green-600">You accepted this invitation</span>
            ) : status === 'rejected' ? (
              <span className="text-amber-600">You declined this invitation</span>
            ) : isExpired ? (
              <span className="text-muted-foreground">This invitation has expired</span>
            ) : (
              <span className="text-muted-foreground">Status: {status}</span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 