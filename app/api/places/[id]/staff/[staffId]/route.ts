import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation for updating staff
const updateStaffSchema = z.object({
  role: z.enum(['manager', 'instructor', 'employee']),
  canEditPlace: z.boolean().default(false),
  canManageEvents: z.boolean().default(false),
  canManageStaff: z.boolean().default(false),
});

// Check if user has permission to manage staff for a place
async function checkStaffManagementPermission(userId: string, placeId: string) {
  if (!userId) {
    return false;
  }

  // Check if user is the owner or has staff management permission
  const staffRecord = await prisma.placeStaff.findFirst({
    where: {
      locationId: placeId,
      userId: userId,
      OR: [
        { role: 'owner' },
        { canManageStaff: true }
      ]
    }
  });

  return !!staffRecord;
}

// PATCH /api/places/[id]/staff/[staffId] - Update a staff member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: placeId, staffId } = params;

  // Check permission
  const hasPermission = await checkStaffManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage staff for this place' },
      { status: 403 }
    );
  }

  try {
    // Get the staff member being modified
    const targetStaff = await prisma.placeStaff.findUnique({
      where: { id: staffId },
      include: { user: { select: { id: true } } }
    });

    if (!targetStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check if target is an owner (owners can't be modified)
    if (targetStaff.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify owner permissions' },
        { status: 403 }
      );
    }

    // Check if current user is the owner or a manager with staff management permissions
    const currentUserStaff = await prisma.placeStaff.findFirst({
      where: {
        locationId: placeId,
        userId: session.user.id,
      }
    });

    if (!currentUserStaff) {
      return NextResponse.json({ error: 'Not authorized to manage staff' }, { status: 403 });
    }

    // Only owners can grant staff management permissions
    const body = await req.json();
    const validatedData = updateStaffSchema.parse(body);

    // Non-owners cannot grant staff management permission
    if (currentUserStaff.role !== 'owner' && validatedData.canManageStaff) {
      return NextResponse.json(
        { error: 'Only owners can grant staff management permissions' },
        { status: 403 }
      );
    }

    // Update the staff member
    const updatedStaff = await prisma.placeStaff.update({
      where: { id: staffId },
      data: {
        role: validatedData.role,
        canEditPlace: validatedData.canEditPlace,
        canManageEvents: validatedData.canManageEvents,
        canManageStaff: validatedData.canManageStaff,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json({ staff: updatedStaff });
  } catch (error) {
    console.error('Error updating staff member:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/places/[id]/staff/[staffId] - Remove a staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: placeId, staffId } = params;

  // Check permission
  const hasPermission = await checkStaffManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage staff for this place' },
      { status: 403 }
    );
  }

  try {
    // Get the staff member being deleted
    const targetStaff = await prisma.placeStaff.findUnique({
      where: { id: staffId }
    });

    if (!targetStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Prevent owners from being deleted
    if (targetStaff.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the owner of a place' },
        { status: 403 }
      );
    }

    // Delete the staff member
    await prisma.placeStaff.delete({
      where: { id: staffId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
} 