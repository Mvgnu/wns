'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  X, 
  Eye, 
  Building2, 
  Map, 
  Flag, 
  Landmark, 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsItem, TabsList } from '@/components/ui/tabs';

// Type for a claim with its related data
interface Claim {
  id: string;
  status: string;
  claimReason: string;
  proofDetails: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
  locationId: string;
  reviewedById: string | null;
  reviewNotes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  location: {
    id: string;
    name: string;
    placeType: string;
    detailType: string;
    images: string[];
  };
  reviewedBy: {
    id: string;
    name: string | null;
  } | null;
}

interface AdminClaimsListProps {
  initialClaims: Claim[];
}

export default function AdminClaimsList({ initialClaims }: AdminClaimsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  
  // Filter claims based on active tab
  const filteredClaims = claims.filter(claim => {
    if (activeTab === 'all') return true;
    return claim.status === activeTab;
  });
  
  // Get counts for each status
  const pendingCount = claims.filter(claim => claim.status === 'pending').length;
  const approvedCount = claims.filter(claim => claim.status === 'approved').length;
  const rejectedCount = claims.filter(claim => claim.status === 'rejected').length;
  
  // Handle claim action (approve or reject)
  const handleClaimAction = async (claimId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reviewNotes,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action} claim`);
      }
      
      const data = await response.json();
      
      // Update claim in local state
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === claimId ? { ...claim, ...data.claim } : claim
        )
      );
      
      // Show success message
      toast({
        title: `Claim ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: action === 'approve' 
          ? 'The user now has management access to this place'
          : 'The claim has been rejected',
        variant: 'default',
      });
      
      // Reset state
      setActiveClaimId(null);
      setReviewNotes('');
      
      // Refresh the page after a delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} claim`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format date to relative time
  const formatDate = (date: string | Date) => {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };
  
  // Get icon for place type
  const getPlaceTypeIcon = (placeType: string) => {
    switch (placeType) {
      case 'facility':
        return <Building2 className="h-4 w-4" />;
      case 'trail':
        return <Map className="h-4 w-4" />;
      case 'spot':
        return <Landmark className="h-4 w-4" />;
      default:
        return <Map className="h-4 w-4" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" /> Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value as any)}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsItem value="pending">
              Pending ({pendingCount})
            </TabsItem>
            <TabsItem value="approved">
              Approved ({approvedCount})
            </TabsItem>
            <TabsItem value="rejected">
              Rejected ({rejectedCount})
            </TabsItem>
            <TabsItem value="all">
              All ({claims.length})
            </TabsItem>
          </TabsList>
        </div>
        
        <TabsContent value="pending" className="mt-6">
          {renderClaimsList(filteredClaims)}
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          {renderClaimsList(filteredClaims)}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          {renderClaimsList(filteredClaims)}
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          {renderClaimsList(filteredClaims)}
        </TabsContent>
      </Tabs>
      
      {/* Review Dialog */}
      <Dialog 
        open={!!activeClaimId} 
        onOpenChange={(open) => {
          if (!open) {
            setActiveClaimId(null);
            setReviewNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Place Claim</DialogTitle>
            <DialogDescription>
              Approve or reject this claim request
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Admin Notes (optional)
                </label>
                <Textarea
                  placeholder="Add notes about your decision (will be sent to the user)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setActiveClaimId(null);
                setReviewNotes('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => activeClaimId && handleClaimAction(activeClaimId, 'reject')}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject Claim'}
            </Button>
            <Button
              onClick={() => activeClaimId && handleClaimAction(activeClaimId, 'approve')}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Approve Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Helper function to render claims list
  function renderClaimsList(claimsToRender: Claim[]) {
    if (claimsToRender.length === 0) {
      return (
        <Card className="bg-gray-50">
          <CardContent className="pt-6 text-center text-gray-500">
            No claims found.
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {claimsToRender.map((claim) => (
          <Card key={claim.id} className={
            claim.status === 'pending' 
              ? 'border-yellow-200 bg-yellow-50' 
              : claim.status === 'approved'
                ? 'border-green-200 bg-green-50'
                : claim.status === 'rejected'
                  ? 'border-red-200 bg-red-50'
                  : ''
          }>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {claim.location.name}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    {getPlaceTypeIcon(claim.location.placeType)}
                    <span className="ml-1 capitalize">
                      {claim.location.placeType} / {claim.location.detailType}
                    </span>
                  </CardDescription>
                </div>
                {getStatusBadge(claim.status)}
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="flex items-center space-x-2 mb-3">
                <Avatar className="h-8 w-8">
                  {claim.user.image ? (
                    <AvatarImage src={claim.user.image} alt={claim.user.name || 'User'} />
                  ) : (
                    <AvatarFallback>
                      {claim.user.name?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{claim.user.name || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">{claim.user.email}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reason for claiming:</p>
                  <p className="text-sm">{claim.claimReason}</p>
                </div>
                
                {claim.proofDetails && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Proof details:</p>
                    <p className="text-sm">{claim.proofDetails}</p>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Submitted {formatDate(claim.createdAt)}</span>
                </div>
                
                {claim.reviewedById && claim.status !== 'pending' && (
                  <div className="text-xs text-muted-foreground">
                    <span>
                      {claim.status === 'approved' ? 'Approved' : 'Rejected'} by {claim.reviewedBy?.name}
                    </span>
                    {claim.reviewNotes && (
                      <p className="mt-1 italic">&ldquo;{claim.reviewNotes}&rdquo;</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <div className="flex justify-between w-full">
                <Link href={`/locations/${claim.locationId}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" /> View Place
                  </Button>
                </Link>
                
                {claim.status === 'pending' && (
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveClaimId(claim.id)}
                    >
                      <Flag className="h-4 w-4 mr-1" /> Review
                    </Button>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
} 