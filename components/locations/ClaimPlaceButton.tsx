'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Flag, Building, Mail, Phone, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ClaimPlaceButtonProps {
  placeId: string;
  placeName: string;
  placeType: string;
  hasExistingClaim?: boolean;
  userIsMember?: boolean;
}

export default function ClaimPlaceButton({ 
  placeId, 
  placeName, 
  placeType,
  hasExistingClaim = false,
  userIsMember = false,
}: ClaimPlaceButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  
  // Form state
  const [reason, setReason] = useState('');
  const [proofDetails, setProofDetails] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(session?.user?.email || '');
  
  // Handle opening the dialog - redirect to login if not logged in
  const handleOpenDialog = () => {
    if (!session) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?returnUrl=${returnUrl}&action=claim`);
      return;
    }
    
    setIsOpen(true);
  };
  
  // Handle claim submission
  const handleSubmitClaim = async () => {
    if (!reason || !contactEmail) {
      toast({
        title: "Missing information",
        description: "Please provide a reason and contact email",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/places/${placeId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimReason: reason,
          proofDetails,
          contactPhone,
          contactEmail,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit claim');
      }
      
      setClaimSuccess(true);
      
      toast({
        title: "Claim submitted",
        description: "Your request to claim this place has been submitted for review",
        variant: "default"
      });
      
      // Reset form
      setReason('');
      setProofDetails('');
      setContactPhone('');
      
      // Refresh the page after a delay to show updated state
      setTimeout(() => {
        router.refresh();
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit claim",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle redirecting to email
  const handleEmailClaim = () => {
    const subject = encodeURIComponent(`Claim request for ${placeName}`);
    const body = encodeURIComponent(
      `Hello,\n\nI would like to claim ownership of "${placeName}" (ID: ${placeId}) on your platform.\n\n` +
      `My name: ${session?.user?.name || '[Your Name]'}\n` +
      `My email: ${session?.user?.email || '[Your Email]'}\n` +
      `Contact phone: [Your Phone Number]\n\n` +
      `Reason for claiming: [Please explain why you should be the owner/manager of this place]\n\n` +
      `Proof of ownership: [Please describe or attach proof that you are the owner or authorized manager of this place]\n\n` +
      `Thank you,\n` +
      `${session?.user?.name || '[Your Name]'}`
    );
    
    // Open the user's email client
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  };
  
  // If user is already a member of this place, don't show the claim button
  if (userIsMember) {
    return null;
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-2" 
        onClick={hasExistingClaim ? handleEmailClaim : handleOpenDialog}
      >
        {hasExistingClaim ? (
          <>
            <Mail className="h-4 w-4 mr-2" /> Email Claim Request
          </>
        ) : (
          <>
            <Flag className="h-4 w-4 mr-2" /> Claim This Place
          </>
        )}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Claim "{placeName}"</DialogTitle>
            <DialogDescription>
              Submit a request to claim this place as the owner or authorized manager.
            </DialogDescription>
          </DialogHeader>
          
          {claimSuccess ? (
            <div className="py-6 space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Claim submitted successfully</AlertTitle>
                <AlertDescription>
                  Your request has been submitted and will be reviewed by our team.
                  We may contact you for additional verification.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground">
                <p>What happens next?</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Our team will review your claim request</li>
                  <li>We may contact you for additional verification</li>
                  <li>Once approved, you will be able to manage this place</li>
                </ul>
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Why are you claiming this place? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="I am the owner/manager of this place..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Explain your relationship to this place and why you should be the authorized manager.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proof">Proof of Ownership/Management</Label>
                  <Textarea
                    id="proof"
                    placeholder="I can provide business registration, website listing..."
                    value={proofDetails}
                    onChange={(e) => setProofDetails(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what proof you can provide that you are associated with this place.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Contact Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Verification Required</AlertTitle>
                  <AlertDescription>
                    All claims require verification before approval. We may contact you
                    to confirm your relationship with this place.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitClaim}
                  disabled={isSubmitting || !reason || !contactEmail}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 