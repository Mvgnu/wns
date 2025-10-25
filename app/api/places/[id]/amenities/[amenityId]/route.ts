import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Check if user has permission to manage amenities for a place
async function checkAmenityManagementPermission(userId: string, placeId: string) {
  if (!userId) {
    return false;
  }

  // Allow the user who added the location
  const location = await prisma.location.findUnique({ where: { id: placeId }, select: { addedById: true } });
  if (location?.addedById === userId) return true;

  // Check if user is the owner or has place edit permission
  const staffRecord = await prisma.placeStaff.findFirst({
    where: {
      locationId: placeId,
      userId: userId,
      OR: [
        { role: 'owner' },
        { role: 'manager' },
        { canEditPlace: true }
      ]
    }
  });

  return !!staffRecord;
}

// DELETE /api/places/[id]/amenities/[amenityId] - Remove an amenity
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; amenityId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: placeId, amenityId } = params;
  
  // Check permission
  const hasPermission = await checkAmenityManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage amenities for this place' },
      { status: 403 }
    );
  }

  try {
    // Get the amenity to verify it exists and belongs to the place
    const amenity = await prisma.placeAmenity.findFirst({
      where: {
        id: amenityId,
        locationId: placeId,
      },
    });

    if (!amenity) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    // Delete the amenity
    await prisma.placeAmenity.delete({ where: { id: amenityId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting amenity:', error);
    return NextResponse.json(
      { error: 'Failed to delete amenity' },
      { status: 500 }
    );
  }
} 