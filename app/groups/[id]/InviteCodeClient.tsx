'use client';

import { Button } from '@/components/ui/button';
import { Share2, ArrowUpRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface InviteCodeClientProps {
  inviteCode: string;
}

export default function InviteCodeClient({ inviteCode }: InviteCodeClientProps) {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Code kopiert!",
        description: "Einladungscode wurde in die Zwischenablage kopiert.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying code:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <h2 className="text-md font-medium mb-3 flex items-center text-gray-900">
        <ArrowUpRight className="h-4 w-4 mr-2 text-blue-500" />
        Freunde einladen
      </h2>
      <p className="text-gray-600 text-sm mb-3">Teile diesen Code, um Freunde in diese private Gruppe einzuladen:</p>
      <div className="bg-gray-50 p-3 rounded-md font-mono text-center border border-gray-200 text-sm mb-3">
        {inviteCode}
      </div>
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyCode}>
        <Share2 className="h-4 w-4" />
        Code kopieren
      </Button>
    </div>
  );
} 