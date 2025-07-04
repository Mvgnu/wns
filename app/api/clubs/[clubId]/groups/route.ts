import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';
import { Prisma } from '@prisma/client';

/**
 * Validation schema for creating a club group
 */
const createClubGroupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
  image: z.string().url().optional(),
  sportId: z.string({ required_error: 'Sport is required' }),
  ageGroup: z.enum(['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18', 'u21', 'senior', 'masters', 'all_ages']).optional(),
  gender: z.enum(['male', 'female', 'mixed']).optional(),
  level: z.enum(['recreational', 'beginner', 'intermediate', 'advanced', 'competitive', 'elite']).optional(),
  useGeneratedName: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Helper function to generate a unique slug
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  
  while (await prisma.group.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Helper function to check if user has permission to manage groups
 */
async function hasManageGroupPermission(userId: string, clubId: string): Promise<boolean> {
  const memberRoles = await prisma.clubMemberRole.findMany({
    where: {
      clubId,
      userId,
    },
    include: {
      role: true,
    },
  });
  
  // Check if user has MANAGE_GROUPS permission in any of their roles
  return memberRoles.some(memberRole => 
    memberRole.role.permissions.includes(ClubPermission.MANAGE_GROUPS)
  );
}

/**
 * GET /api/clubs/[clubId]/groups
 * Fetch groups for a specific club with optional filtering
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const clubId = params.clubId;
    const searchParams = req.nextUrl.searchParams;
    const sportId = searchParams.get('sportId');
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
    
    // Build where clause for the query
    const where: Prisma.GroupWhereInput = {
      clubGroups: {
        some: {
          clubId,
        },
      },
    };
    
    // Add optional filters
    if (sportId) {
      where.clubGroups = {
        some: {
          clubId,
          sportId,
        },
      };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Query groups with their club-specific associations
    const groups = await prisma.group.findMany({
      where,
      include: {
        clubGroups: {
          where: { clubId },
          include: {
            sport: true,
          },
        },
        _count: {
          select: {
            members: true,
            events: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Transform data for response
    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      image: group.image,
      slug: group.slug,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.members,
      eventCount: group._count.events,
      clubGroup: group.clubGroups[0] ? {
        id: group.clubGroups[0].id,
        ageGroup: group.clubGroups[0].ageGroup,
        gender: group.clubGroups[0].gender,
        level: group.clubGroups[0].level,
        isDefault: group.clubGroups[0].isDefault,
        sport: {
          id: group.clubGroups[0].sport.id,
          name: group.clubGroups[0].sport.name,
        },
      } : null,
    }));
    
    return NextResponse.json({ groups: formattedGroups });
  } catch (error) {
    console.error('Error fetching club groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs/[clubId]/groups
 * Create a new group for a club
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }
    
    const clubId = params.clubId;
    
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        settings: true,
      },
    });
    
    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to create groups
    const canManageGroups = await hasManageGroupPermission(session.user.id, clubId);
    
    // If setting exists and user doesn't have permission
    if (!canManageGroups && !(club.settings as any)?.allowMembersToCreateGroups) {
      return NextResponse.json(
        { error: 'You do not have permission to create groups in this club' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = createClubGroupSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Verify sport exists and belongs to the club
    const sport = await prisma.clubSport.findFirst({
      where: {
        id: data.sportId,
        clubId,
      },
    });
    
    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found or does not belong to this club' },
        { status: 400 }
      );
    }
    
    // Generate a unique slug for the group
    const slug = await generateUniqueSlug(data.name);
    
    // Create group and associations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the base group
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          slug,
          sport: sport.name,
          ownerId: session.user.id,
          isPrivate: false,
          status: 'active',
          members: {
            connect: { id: session.user.id },
          },
        },
      });
      
      // Create the club group association
      const clubGroup = await tx.clubGroup.create({
        data: {
          clubId,
          sportId: data.sportId,
          groupId: group.id,
          level: data.level,
          ageGroup: data.ageGroup,
          gender: data.gender,
          isDefault: data.isDefault || false,
        },
      });
      
      // Create default group roles
      const adminRole = await tx.groupRole.create({
        data: {
          groupId: group.id,
          name: 'Admin',
          description: 'Full access to manage the group',
          permissions: ['MANAGE_GROUP', 'MANAGE_MEMBERS', 'CREATE_EVENT', 'EDIT_CONTENT', 'INVITE_MEMBERS'],
          isDefault: false,
        },
      });
      
      // Assign admin role to creator
      await tx.groupMemberRole.create({
        data: {
          groupId: group.id,
          userId: session.user.id,
          roleId: adminRole.id,
          assignedBy: session.user.id,
        },
      });
      
      return { group, clubGroup };
    });
    
    return NextResponse.json({
      success: true,
      group: {
        id: result.group.id,
        name: result.group.name,
        slug: result.group.slug,
        description: result.group.description,
        image: result.group.image,
        clubGroup: result.clubGroup,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating club group:', error);
    return NextResponse.json(
      { error: 'Failed to create club group' },
      { status: 500 }
    );
  }
} 