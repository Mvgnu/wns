import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation for adding amenities
const addAmenitySchema = z.object({
  amenities: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      icon: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    })
  ),
});

// Check if user has permission to manage amenities for a place
async function checkAmenityManagementPermission(userId: string, placeId: string) {
  if (!userId) {
    return false;
  }

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

// GET /api/places/[id]/amenities - Get all amenities for a place
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const placeId = params.id;
  
  try {
    // Get the place to check if it exists
    const place = await prisma.location.findUnique({
      where: { id: placeId },
      select: { id: true }
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // Get all amenities for the place
    const amenities = await prisma.placeAmenity.findMany({
      where: {
        locationId: placeId,
      },
      orderBy: {
        name: 'asc',
      }
    });

    return NextResponse.json({ amenities });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}

// POST /api/places/[id]/amenities - Add new amenities to a place
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const placeId = params.id;
  
  // Check permission
  const hasPermission = await checkAmenityManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage amenities for this place' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = addAmenitySchema.parse(body);
    
    // Get the place to check if it exists
    const place = await prisma.location.findUnique({
      where: { id: placeId },
      select: { id: true }
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // Create new amenities
    const amenities = await Promise.all(
      validatedData.amenities.map(async (amenity) => {
        // Check if amenity already exists
        const existingAmenity = await prisma.placeAmenity.findFirst({
          where: {
            locationId: placeId,
            name: amenity.name,
          },
        });

        if (existingAmenity) {
          return existingAmenity;
        }

        // Create new amenity
        return prisma.placeAmenity.create({
          data: {
            locationId: placeId,
            name: amenity.name,
            icon: amenity.icon,
            description: amenity.description,
          },
        });
      })
    );

    return NextResponse.json({ amenities }, { status: 201 });
  } catch (error) {
    console.error('Error adding amenities:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add amenities' },
      { status: 500 }
    );
  }
} 