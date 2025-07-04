import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';

// Validation schema for updating a member's role
const updateRoleSchema = z.object({
  roleId: z.string({ required_error: 'Role ID is required' }),
});

/**
 * PUT /api/clubs/[clubId]/members/[userId]/roles
 * Update a member's role in a club
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { clubId: string; userId: string } }
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
    
    const { clubId, userId } = params;
    
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
    
    // Check if user has permission to manage members
    const userRoles = await prisma.clubMemberRole.findMany({
      where: {
        clubId,
        userId: session.user.id,
      },
      include: {
        role: true,
      },
    });
    
    const canManageMembers = userRoles.some((memberRole: any) => 
      memberRole.role.permissions.includes(ClubPermission.MANAGE_MEMBERS)
    );
    
    if (!canManageMembers) {
      return NextResponse.json(
        { error: 'You do not have permission to manage member roles in this club' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = updateRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { roleId } = validation.data;
    
    // Check if the role exists and belongs to the club
    const role = await prisma.clubRole.findFirst({
      where: {
        id: roleId,
        clubId,
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found or does not belong to this club' },
        { status: 404 }
      );
    }
    
    // Check if the member exists
    const member = await prisma.clubMemberRole.findFirst({
      where: {
        clubId,
        userId,
      },
    });
    
    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of this club' },
        { status: 404 }
      );
    }
    
    // Check if the target already has the role
    const existingRole = await prisma.clubMemberRole.findFirst({
      where: {
        clubId,
        userId,
        roleId,
      },
    });
    
    if (existingRole) {
      return NextResponse.json({
        memberRole: existingRole,
        role,
        message: 'Member already has this role',
      });
    }
    
    // Update the member's role - first remove existing roles
    await prisma.clubMemberRole.deleteMany({
      where: {
        clubId,
        userId,
      },
    });
    
    // Then add the new role
    const memberRole = await prisma.clubMemberRole.create({
      data: {
        clubId,
        userId,
        roleId,
        assignedBy: session.user.id,
      },
    });
    
    return NextResponse.json({
      memberRole,
      role,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
} 