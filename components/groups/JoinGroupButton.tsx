'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface JoinGroupButtonProps {
  groupId: string;
  isMember: boolean;
  isPending?: boolean;
  isPrivate?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function JoinGroupButton({
  groupId,
  isMember,
  isPending = false,
  isPrivate = false,
  className = '',
  variant = 'default',
  size = 'default',
}: JoinGroupButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [memberStatus, setMemberStatus] = useState({ 
    isMember, 
    isPending 
  });

  const handleJoinLeave = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/groups/' + groupId);
      return;
    }

    setLoading(true);

    try {
      if (memberStatus.isMember) {
        // Leave group
        const response = await fetch(`/api/groups/${groupId}/members`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Fehler beim Verlassen der Gruppe');
        }

        setMemberStatus({ isMember: false, isPending: false });
        toast({
          title: 'Gruppe verlassen',
          description: 'Du hast die Gruppe erfolgreich verlassen',
          variant: 'default',
        });
      } else if (memberStatus.isPending) {
        // Cancel request
        const response = await fetch(`/api/groups/${groupId}/requests`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Fehler beim Zurückziehen der Anfrage');
        }

        setMemberStatus({ isMember: false, isPending: false });
        toast({
          title: 'Anfrage zurückgezogen',
          description: 'Deine Anfrage zum Beitritt wurde zurückgezogen',
          variant: 'default',
        });
      } else {
        // Join group or send request
        const endpoint = isPrivate 
          ? `/api/groups/${groupId}/requests` 
          : `/api/groups/${groupId}/members`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(isPrivate 
            ? 'Fehler beim Senden der Beitrittsanfrage' 
            : 'Fehler beim Beitreten der Gruppe'
          );
        }

        setMemberStatus({ 
          isMember: !isPrivate, 
          isPending: isPrivate 
        });
        
        toast({
          title: isPrivate ? 'Anfrage gesendet' : 'Gruppe beigetreten',
          description: isPrivate 
            ? 'Deine Anfrage zum Beitritt wurde gesendet' 
            : 'Du bist der Gruppe erfolgreich beigetreten',
          variant: 'default',
        });
      }

      router.refresh();
    } catch (error) {
      console.error('Gruppenaktion fehlgeschlagen:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine button text based on membership status
  let buttonText = 'Gruppe beitreten';
  
  if (memberStatus.isMember) {
    buttonText = 'Gruppe verlassen';
  } else if (memberStatus.isPending) {
    buttonText = 'Anfrage ausstehend';
  } else if (isPrivate) {
    buttonText = 'Beitrittsanfrage senden';
  }

  return (
    <Button
      onClick={handleJoinLeave}
      className={className}
      variant={memberStatus.isMember ? 'outline' : variant}
      size={size}
      disabled={loading}
    >
      {loading ? 'Wird verarbeitet...' : buttonText}
    </Button>
  );
} 