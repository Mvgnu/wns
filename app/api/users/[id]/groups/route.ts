import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;
    
    // Optional: Check if the user is accessing their own data or has permission
    // For now, we'll allow public access to user groups
    
    // Get the user's owned and member groups
    const ownedGroups = await prisma.group.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const memberGroups = await prisma.group.findMany({
      where: {
        members: {
          some: { id: userId }
        },
        NOT: { ownerId: userId } // Exclude owned groups to avoid duplicates
      },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Combine and format groups
    const groups = [
      ...ownedGroups.map(group => ({
        ...group,
        memberCount: group._count.members + 1, // +1 for the owner
        isOwner: true
      })),
      ...memberGroups.map(group => ({
        ...group,
        memberCount: group._count.members + 1, // +1 for the owner
        isOwner: false
      }))
    ];
    
    return NextResponse.json({
      groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user groups' },
      { status: 500 }
    );
  }
} 