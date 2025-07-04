import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';
import { Prisma } from '@prisma/client';

// Validation schema for adding a new member
const addMemberSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }),
  roleId: z.string({ required_error: 'Role ID is required' }),
});

// Type for ClubMemberRole with expanded relations
interface ClubMemberRoleWithRelations {
  id: string;
  clubId: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  role: {
    id: string;
    name: string;
    color: string | null;
    permissions: string[];
  };
}

/**
 * GET /api/clubs/[clubId]/members
 * Fetch members for a specific club with optional filtering
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
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    
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
    
    // Determine if user has permission to view members
    const userRoles = await prisma.clubMemberRole.findMany({
      where: {
        clubId,
        userId: session.user.id,
      },
      include: {
        role: true,
      },
    });
    
    const canViewMembers = userRoles.some((memberRole: any) => 
      memberRole.role.permissions.includes(ClubPermission.VIEW_MEMBERS)
    );
    
    if (!isMember && !canViewMembers) {
      return NextResponse.json(
        { error: 'You do not have permission to view club members' },
        { status: 403 }
      );
    }
    
    // Build the where clause
    const where: any = {
      clubId,
    };
    
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    // Fetch club members
    const memberRoles = await prisma.clubMemberRole.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            color: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
    
    // Group by user to handle multiple roles
    const membersByUser: Record<string, any> = {};
    memberRoles.forEach((memberRole: any) => {
      const userId = memberRole.userId;
      
      if (!membersByUser[userId]) {
        membersByUser[userId] = {
          id: memberRole.id,
          userId: memberRole.userId,
          user: memberRole.user,
          roles: [],
          joinedAt: memberRole.assignedAt,
        };
      }
      
      membersByUser[userId].roles.push({
        id: memberRole.id,
        role: memberRole.role,
      });
    });
    
    const members = Object.values(membersByUser);
    
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching club members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs/[clubId]/members
 * Add a new member to the club
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
        { error: 'You do not have permission to add members to this club' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = addMemberSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if role exists and belongs to club
    const role = await prisma.clubRole.findFirst({
      where: {
        id: data.roleId,
        clubId,
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found or does not belong to this club' },
        { status: 404 }
      );
    }
    
    // Check if user is already a member
    const existingMember = await prisma.clubMemberRole.findFirst({
      where: {
        clubId,
        userId: data.userId,
      },
    });
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this club' },
        { status: 400 }
      );
    }
    
    // Add the user as a member
    const memberRole = await prisma.clubMemberRole.create({
      data: {
        clubId,
        userId: data.userId,
        roleId: data.roleId,
        assignedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            color: true,
            permissions: true,
          },
        },
      },
    });
    
    // Format the response
    const member = {
      id: memberRole.id,
      userId: memberRole.userId,
      user: memberRole.user,
      roles: [{
        id: memberRole.id,
        role: memberRole.role,
      }],
      joinedAt: memberRole.assignedAt,
    };
    
    return NextResponse.json({
      member,
      message: 'Member added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding club member:', error);
    return NextResponse.json(
      { error: 'Failed to add member to club' },
      { status: 500 }
    );
  }
} 