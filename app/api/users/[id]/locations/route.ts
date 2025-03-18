export const dynamic = "force-static";
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
    
    // Get pagination parameters
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get the user's locations
    const locations = await prisma.location.findMany({
      where: { addedById: userId },
      include: {
        _count: {
          select: {
            reviews: true,
            events: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.location.count({
      where: { addedById: userId }
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      locations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching user locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user locations' },
      { status: 500 }
    );
  }
} 