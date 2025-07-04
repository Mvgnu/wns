import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendPlaceClaimStatusEmail } from '@/lib/email';

// Schema validation for the action request
const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional(),
});

// Check if user is an admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  
  return !!user?.isAdmin;
}

// PATCH /api/admin/claims/[id] - Approve or reject a place claim
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Ensure user is authenticated and an admin
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminId = session.user.id;
  
  // Verify admin status
  const adminCheck = await isAdmin(adminId);
  if (!adminCheck) {
    return NextResponse.json(
      { error: 'Only administrators can manage place claims' },
      { status: 403 }
    );
  }

  const claimId = params.id;
  
  try {
    // Validate request body
    const body = await req.json();
    const { action, reviewNotes } = actionSchema.parse(body);
    
    // Get the claim
    const claim = await prisma.placeClaim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        location: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }
    
    // If claim is already processed, reject the request
    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: 'This claim has already been processed' },
        { status: 409 }
      );
    }
    
    // Process the claim based on the action
    if (action === 'approve') {
      // Create staff record for the user with owner role
      await prisma.placeStaff.create({
        data: {
          userId: claim.userId,
          locationId: claim.locationId,
          role: 'owner',
          canEditPlace: true,
          canManageEvents: true,
          canManageStaff: true,
        }
      });
    }
    
    // Update claim status
    const updatedClaim = await prisma.placeClaim.update({
      where: { id: claimId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedById: adminId,
        reviewNotes: reviewNotes || null,
      }
    });
    
    // Send email notification to the user
    try {
      if (claim.user.email) {
        await sendPlaceClaimStatusEmail({
          to: claim.user.email,
          placeName: claim.location.name,
          status: action === 'approve' ? 'approved' : 'rejected',
          message: reviewNotes,
        });
      }
    } catch (emailError) {
      console.error('Failed to send claim status email:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Claim ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      claim: updatedClaim
    });
    
  } catch (error) {
    console.error('Error processing place claim:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process place claim' },
      { status: 500 }
    );
  }
} 