import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClubPermission } from '@/lib/models/permissions';
import { clubSchema, DEFAULT_CLUB_ROLES, ClubRoleData } from '@/lib/models/clubs';
import { Prisma } from '@prisma/client';

// Validation schema for creating a club
const createClubSchema = clubSchema.extend({
  locations: z.array(z.string()).optional(),
  primaryLocationId: z.string().optional(),
  sports: z.array(z.string()).optional(),
});

// Define a type for the Club data structure
interface ClubData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  contactEmail: string | null;
  verified: boolean;
  memberCount: number;
  groupCount: number;
  sports: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  locations: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/clubs
 * Fetch all clubs with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const sport = searchParams.get('sport');
    const locationId = searchParams.get('locationId');
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: Prisma.ClubWhereInput = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    // Filter by sport if provided
    if (sport) {
      where.sports = {
        some: {
          name: { contains: sport, mode: 'insensitive' },
        },
      };
    }
    
    // Filter by location if provided
    if (locationId) {
      where.locations = {
        some: {
          locationId,
        },
      };
    }

    // Get the total count for pagination
    const totalCount = await prisma.club.count({ where });

    // Fetch the clubs with their relationships
    const clubs = await prisma.club.findMany({
      where,
      skip,
      take: limit,
      include: {
        locations: {
          include: {
            location: true,
          },
        },
        sports: true,
        roles: {
          where: {
            isDefault: true,
          },
        },
        _count: {
          select: {
            memberRoles: true,
            groups: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data for the response
    const data: ClubData[] = clubs.map((club) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      logo: club.logo,
      coverImage: club.coverImage,
      website: club.website,
      contactEmail: club.contactEmail,
      verified: club.verified,
      memberCount: club._count.memberRoles,
      groupCount: club._count.groups,
      sports: club.sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        icon: sport.icon,
      })),
      locations: club.locations.map((loc) => ({
        id: loc.locationId,
        name: loc.location.name,
        isPrimary: loc.isPrimary,
      })),
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    }));

    return NextResponse.json({
      clubs: data,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs
 * Create a new club
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a club' },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validation = createClubSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Generate a unique slug from the club name
    const baseSlug = slugify(data.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Check if the slug already exists and generate a unique one
    while (await prisma.club.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the club and its relationships in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the club
      const club = await tx.club.create({
        data: {
          name: data.name,
          description: data.description,
          logo: data.logo,
          coverImage: data.coverImage,
          website: data.website,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          foundedYear: data.foundedYear,
          settings: data.settings || {},
          status: 'active',
          verified: false,
          slug,
        },
      });

      // Create default roles
      const roles = await Promise.all(
        DEFAULT_CLUB_ROLES.map((role: ClubRoleData) => {
          return tx.clubRole.create({
            data: {
              clubId: club.id,
              name: role.name,
              description: role.description,
              color: role.color,
              permissions: role.permissions,
              isDefault: role.isDefault,
              inheritToGroups: role.inheritToGroups || false,
            },
          });
        })
      );

      // Find the admin role to assign to the creator
      const adminRole = roles.find(role => role.name === 'Admin');
      
      if (!adminRole) {
        throw new Error('Failed to create admin role');
      }
      
      // Add the creator as a club member with admin role
      await tx.clubMemberRole.create({
        data: {
          clubId: club.id,
          userId: session.user.id,
          roleId: adminRole.id,
          assignedBy: session.user.id,
        },
      });

      // Add sports if provided
      if (data.sports && data.sports.length > 0) {
        await Promise.all(
          data.sports.map(sport => {
            return tx.clubSport.create({
              data: {
                clubId: club.id,
                name: sport,
              },
            });
          })
        );
      }

      // Add locations if provided
      if (data.locations && data.locations.length > 0) {
        await Promise.all(
          data.locations.map(locationId => {
            return tx.clubLocation.create({
              data: {
                clubId: club.id,
                locationId,
                isPrimary: data.primaryLocationId === locationId,
              },
            });
          })
        );
      }

      return club;
    });

    return NextResponse.json({
      club: {
        id: result.id,
        name: result.name,
        description: result.description,
        slug: result.slug,
        logo: result.logo,
        coverImage: result.coverImage,
        website: result.website,
        contactEmail: result.contactEmail,
        contactPhone: result.contactPhone,
        foundedYear: result.foundedYear,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
} 