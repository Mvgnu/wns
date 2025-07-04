import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';
import { clubRoleSchema } from '@/lib/models/clubs';

/**
 * GET /api/clubs/[clubId]/roles
 * Fetch roles for a specific club
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clubId = params.clubId;
    
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });
    
    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the club
    const isMember = await prisma.clubMemberRole.findFirst({
      where: {
        clubId,
        userId: session.user.id,
      },
    });
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      );
    }
    
    // Fetch club roles
    const roles = await prisma.clubRole.findMany({
      where: { clubId },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });
    
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching club roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs/[clubId]/roles
 * Create a new role for a club
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const clubId = params.clubId;
    
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });
    
    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to manage roles
    const userRoles = await prisma.clubMemberRole.findMany({
      where: {
        clubId,
        userId: session.user.id,
      },
      include: {
        role: true,
      },
    });
    
    const canManageRoles = userRoles.some((memberRole: any) => 
      memberRole.role.permissions.includes(ClubPermission.MANAGE_ROLES)
    );
    
    if (!canManageRoles) {
      return NextResponse.json(
        { error: 'You do not have permission to manage roles in this club' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = clubRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if a role with the same name already exists
    const existingRole = await prisma.clubRole.findFirst({
      where: {
        clubId,
        name: data.name,
      },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create the role
    const role = await prisma.clubRole.create({
      data: {
        clubId,
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions,
        isDefault: data.isDefault || false,
        inheritToGroups: data.inheritToGroups || false,
      },
    });
    
    // If this is set as default, remove default from other roles
    if (data.isDefault) {
      await prisma.clubRole.updateMany({
        where: {
          clubId,
          id: { not: role.id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    return NextResponse.json({
      role,
      message: 'Role created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating club role:', error);
    return NextResponse.json(
      { error: 'Failed to create club role' },
      { status: 500 }
    );
  }
} 