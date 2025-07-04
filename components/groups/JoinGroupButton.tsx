'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EyeOffIcon } from 'lucide-react';

interface JoinGroupButtonProps {
  groupId: string;
  isMember: boolean;
  isPending?: boolean;
  isPrivate?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showAnonymousOption?: boolean;
}

export default function JoinGroupButton({
  groupId,
  isMember,
  isPending = false,
  isPrivate = false,
  className = '',
  variant = 'default',
  size = 'default',
  showAnonymousOption = true,
}: JoinGroupButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [memberStatus, setMemberStatus] = useState({ 
    isMember, 
    isPending 
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isAnonymous: isAnonymous
          }),
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
            : `Du bist der Gruppe ${isAnonymous ? 'anonym' : 'erfolgreich'} beigetreten`,
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
      setPopoverOpen(false);
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

  // If already a member or it's a pending request, just show the button
  if (memberStatus.isMember || memberStatus.isPending || !showAnonymousOption) {
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

  // Otherwise show a popover with anonymous option
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className={className}
          variant={variant}
          size={size}
          disabled={loading}
        >
          {loading ? 'Wird verarbeitet...' : buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="anonymous" 
              checked={isAnonymous} 
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="anonymous" className="font-medium flex items-center gap-1">
                <EyeOffIcon className="h-3.5 w-3.5" />
                Anonym beitreten
              </Label>
              <p className="text-sm text-muted-foreground">
                Nur der Organisator kann deinen Namen und dein Profilbild sehen. Für andere Mitglieder bleibst du anonym.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPopoverOpen(false)}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleJoinLeave} disabled={loading}>
              {loading ? 'Wird verarbeitet...' : 'Bestätigen'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 