import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation for adding staff
const addStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['manager', 'instructor', 'employee']),
  canEditPlace: z.boolean().default(false),
  canManageEvents: z.boolean().default(false),
  canManageStaff: z.boolean().default(false),
});

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

// GET /api/places/[id]/staff
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const placeId = params.id;
  
  try {
    // Get all staff members for the place
    const staff = await prisma.placeStaff.findMany({
      where: {
        locationId: placeId,
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
      },
      orderBy: {
        createdAt: 'asc',
      }
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/places/[id]/staff - Add a new staff member
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
  const hasPermission = await checkStaffManagementPermission(session.user.id, placeId);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'You do not have permission to manage staff for this place' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = addStaffSchema.parse(body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. The user must be registered on the platform.' },
        { status: 404 }
      );
    }

    // Check if user is already a staff member
    const existingStaff = await prisma.placeStaff.findFirst({
      where: {
        locationId: placeId,
        userId: user.id,
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'This user is already a staff member for this place' },
        { status: 409 }
      );
    }

    // Create new staff member
    const newStaff = await prisma.placeStaff.create({
      data: {
        userId: user.id,
        locationId: placeId,
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

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (error) {
    console.error('Error adding staff member:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add staff member' },
      { status: 500 }
    );
  }
} 