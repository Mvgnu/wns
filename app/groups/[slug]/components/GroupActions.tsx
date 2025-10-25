'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface GroupActionsProps {
  groupId: string;
  groupSlug?: string | null;
  isOwner: boolean;
  initialInviteLink?: string | null;
}

export default function GroupActions({ groupId, groupSlug, isOwner, initialInviteLink }: GroupActionsProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(initialInviteLink || null);

  const generateInviteLink = async () => {
    try {
      const response = await fetch(`/api/groups/invites`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newLink = `${window.location.origin}/groups/join/${data.inviteCode}`;
        setInviteLink(newLink);
        toast({
          title: "Einladungslink erstellt",
          description: "Der Link wurde generiert und kann jetzt geteilt werden",
          variant: "default"
        });
      } else {
        toast({
          title: "Fehler",
          description: "Der Einladungslink konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Es ist ein Fehler aufgetreten",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link kopiert",
        description: "Der Link wurde in die Zwischenablage kopiert",
        variant: "default"
      });
    }
  };

  if (!isOwner) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/groups/${groupSlug || groupId}/edit`}>
        <Button variant="outline" size="sm">
          Gruppe bearbeiten
        </Button>
      </Link>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={generateInviteLink}
      >
        Einladungslink generieren
      </Button>
      
      {inviteLink && (
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={inviteLink} 
            readOnly 
            className="pr-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-0 h-full rounded-l-none"
            onClick={copyToClipboard}
          >
            Kopieren
          </Button>
        </div>
      )}
    </div>
  );
} 