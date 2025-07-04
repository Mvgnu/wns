import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendAdminNotificationEmail } from '@/lib/email';

// Schema validation for the place claim request
const claimSchema = z.object({
  claimReason: z.string().min(10, 'Reason must be at least 10 characters'),
  proofDetails: z.string().optional(),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
});

// POST /api/places/[id]/claim - Submit a new claim request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const placeId = params.id;
  const userId = session.user.id;
  
  try {
    // Validate request body
    const body = await req.json();
    const validatedData = claimSchema.parse(body);
    
    // Check if place exists
    const place = await prisma.location.findUnique({
      where: { id: placeId },
      include: {
        staff: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }
    
    // Check if user is already a staff member for this place
    if (place.staff.length > 0) {
      return NextResponse.json(
        { error: 'You are already a staff member for this place' },
        { status: 409 }
      );
    }
    
    // Check if user already has a pending claim for this place
    const existingClaim = await prisma.placeClaim.findFirst({
      where: {
        locationId: placeId,
        userId,
        status: 'pending'
      }
    });
    
    if (existingClaim) {
      return NextResponse.json(
        { error: 'You already have a pending claim for this place' },
        { status: 409 }
      );
    }
    
    // Create the claim
    const claim = await prisma.placeClaim.create({
      data: {
        claimReason: validatedData.claimReason,
        proofDetails: validatedData.proofDetails || null,
        contactPhone: validatedData.contactPhone || null,
        contactEmail: validatedData.contactEmail,
        user: { connect: { id: userId } },
        location: { connect: { id: placeId } },
      },
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
            placeType: true,
            detailType: true,
          }
        }
      }
    });
    
    // Send notification email to admins
    try {
      await sendAdminNotificationEmail({
        subject: `New Place Claim Request: ${place.name}`,
        message: `
          <p>A new claim request has been submitted:</p>
          <ul>
            <li><strong>Place:</strong> ${place.name} (${place.placeType} - ${place.detailType})</li>
            <li><strong>User:</strong> ${session.user.name} (${session.user.email})</li>
            <li><strong>Reason:</strong> ${validatedData.claimReason}</li>
            <li><strong>Contact:</strong> ${validatedData.contactEmail} ${validatedData.contactPhone ? `/ ${validatedData.contactPhone}` : ''}</li>
          </ul>
          <p>Please review this claim in the <a href="${process.env.NEXTAUTH_URL}/admin/claims">admin dashboard</a>.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Claim submitted successfully',
      claim: {
        id: claim.id,
        status: 'pending',
        createdAt: claim.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating place claim:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit place claim' },
      { status: 500 }
    );
  }
}

// GET /api/places/[id]/claim - Get claim status for the current user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const placeId = params.id;
  const userId = session.user.id;
  
  try {
    // Get user's claim for this place
    const claim = await prisma.placeClaim.findFirst({
      where: {
        locationId: placeId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Check if user is already a staff member
    const staffMember = await prisma.placeStaff.findFirst({
      where: {
        locationId: placeId,
        userId
      },
      select: {
        id: true,
        role: true
      }
    });
    
    return NextResponse.json({ 
      claim, 
      isStaffMember: !!staffMember,
      staffRole: staffMember?.role || null
    });
    
  } catch (error) {
    console.error('Error fetching place claim status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim status' },
      { status: 500 }
    );
  }
} 