'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ShareButtonClientProps {
  groupName: string;
  className?: string;
}

export default function ShareButtonClient({ groupName, className }: ShareButtonClientProps) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: groupName,
          text: `Schau dir diese Gruppe an: ${groupName}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link kopiert!",
          description: "Link wurde in die Zwischenablage kopiert.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Button variant="outline" className={`gap-2 ${className}`} onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      Teilen
    </Button>
  );
} 