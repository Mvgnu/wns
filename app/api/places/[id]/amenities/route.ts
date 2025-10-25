import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation for adding amenities
const addAmenitySchema = z.object({
  amenities: z.array(
    z.object({
      type: z.string().min(1, 'Type is required'),
      name: z.string().optional(),
      details: z.any().optional(),
      isAvailable: z.boolean().optional(),
    })
  ),
});

function toAmenityEnum(typeId: string): string {
  return typeId.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function toDisplayName(idOrName?: string): string | undefined {
  if (!idOrName) return undefined;
  const s = idOrName.replace(/[_-]+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Check if user has permission to manage amenities for a place
async function checkAmenityManagementPermission(userId: string, placeId: string) {
  if (!userId) {
    return false;
  }

  // Allow the user who added the location
  const location = await prisma.location.findUnique({ where: { id: placeId }, select: { addedById: true } });
  if (location?.addedById === userId) return true;

  // Or user is staff with permissions
  const staffRecord = await prisma.placeStaff.findFirst({
    where: {
      locationId: placeId,
      userId: userId,
      OR: [
        { role: 'owner' },
        { role: 'manager' },
        { canEditPlace: true },
      ],
    },
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
    const place = await prisma.location.findUnique({ where: { id: placeId }, select: { id: true } });
    if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    const amenities = await prisma.placeAmenity.findMany({
      where: { locationId: placeId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ amenities });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });
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
  
  const hasPermission = await checkAmenityManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage amenities for this place' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = addAmenitySchema.parse(body);

    const place = await prisma.location.findUnique({ where: { id: placeId }, select: { id: true } });
    if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    const amenities = await Promise.all(
      validatedData.amenities.map(async (amenity) => {
        const type = toAmenityEnum(amenity.type);
        const name = amenity.name || toDisplayName(amenity.type) || amenity.type;
        const isAvailable = amenity.isAvailable ?? true;
        return prisma.placeAmenity.upsert({
          where: { locationId_type: { locationId: placeId, type: type as any } },
          update: { name, isAvailable, details: amenity.details as any },
          create: { locationId: placeId, type: type as any, name, isAvailable, details: amenity.details as any },
        });
      })
    );

    return NextResponse.json({ amenities }, { status: 201 });
  } catch (error) {
    console.error('Error adding amenities:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add amenities' }, { status: 500 });
  }
} 