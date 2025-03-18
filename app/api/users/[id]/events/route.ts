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
    
    // Get pagination and filter parameters
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const showPast = searchParams.get('showPast') === 'true';
    
    // Build date filter
    const dateFilter = showPast 
      ? {} // Show all events
      : { startTime: { gte: new Date() } }; // Only future events
    
    // Get events the user has organized or is attending
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { attendees: { some: { id: userId } } }
        ],
        ...dateFilter
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: { startTime: showPast ? 'desc' : 'asc' },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.event.count({
      where: {
        OR: [
          { organizerId: userId },
          { attendees: { some: { id: userId } } }
        ],
        ...dateFilter
      }
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user events' },
      { status: 500 }
    );
  }
} 