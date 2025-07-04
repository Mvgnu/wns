import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';

/**
 * DELETE /api/clubs/[clubId]/members/[userId]
 * Remove a member from a club
 */
export async function DELETE(
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
    
    const isCurrentUser = session.user.id === userId;
    
    // Only allow if user is removing themselves or has permission
    if (!isCurrentUser && !canManageMembers) {
      return NextResponse.json(
        { error: 'You do not have permission to remove members from this club' },
        { status: 403 }
      );
    }
    
    // Check if the member to remove is the club owner/admin
    const targetUserRoles = await prisma.clubMemberRole.findMany({
      where: {
        clubId,
        userId,
      },
      include: {
        role: true,
      },
    });
    
    const isTargetAdmin = targetUserRoles.some((memberRole: any) => 
      memberRole.role.permissions.includes(ClubPermission.MANAGE_CLUB)
    );
    
    const isCurrentUserAdmin = userRoles.some((memberRole: any) => 
      memberRole.role.permissions.includes(ClubPermission.MANAGE_CLUB)
    );
    
    // Don't allow removing an admin unless done by another admin
    if (isTargetAdmin && !isCurrentUserAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to remove an admin from this club' },
        { status: 403 }
      );
    }
    
    // Check if member exists
    const memberRoles = await prisma.clubMemberRole.findMany({
      where: {
        clubId,
        userId,
      },
    });
    
    if (memberRoles.length === 0) {
      return NextResponse.json(
        { error: 'User is not a member of this club' },
        { status: 404 }
      );
    }
    
    // Remove all roles for the member
    await prisma.clubMemberRole.deleteMany({
      where: {
        clubId,
        userId,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing club member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from club' },
      { status: 500 }
    );
  }
} 