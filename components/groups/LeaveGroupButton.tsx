'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type LeaveGroupButtonProps = {
  groupId: string;
  isMember: boolean;
};

export default function LeaveGroupButton({ groupId, isMember }: LeaveGroupButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Only show the button if user is a member
  if (!isMember) {
    return null;
  }

  const handleLeaveGroup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to leave group');
      }

      toast({
        title: 'Erfolgreich',
        description: 'Du hast die Gruppe verlassen',
        variant: 'default',
      });

      // Refresh the page after leaving
      router.refresh();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Fehler',
        description: 'Beim Verlassen der Gruppe ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Gruppe verlassen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gruppe verlassen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du diese Gruppe wirklich verlassen? Du wirst nicht mehr auf gruppenspezifische Inhalte zugreifen können.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLeaveGroup}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Verlassen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 