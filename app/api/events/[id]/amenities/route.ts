import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extendEvent } from '@/lib/prisma-extensions';
import { z } from 'zod';

// Schema validation for highlighted amenities request
const amenitiesSchema = z.object({
  highlightedAmenities: z.array(z.string())
});

// Type definitions for raw query results
type RawEventWithAmenities = {
  id: string;
  highlightedAmenities: string[];
  locationId: string | null;
};

type RawPlaceAmenity = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  locationId: string;
};

// GET /api/events/[id]/amenities - Get highlighted amenities for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  try {
    // Get event with highlighted amenities
    const events = await prisma.$queryRaw<RawEventWithAmenities[]>`
      SELECT 
        id, 
        "highlightedAmenities", 
        "locationId"
      FROM "Event" 
      WHERE id = ${eventId}
    `;
    
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = events[0];
    const typedEvent = extendEvent(event);
    
    // If event has a location, fetch its amenities
    let locationAmenities: RawPlaceAmenity[] = [];
    if (event.locationId) {
      // Use raw query to fetch location amenities
      locationAmenities = await prisma.$queryRaw<RawPlaceAmenity[]>`
        SELECT * FROM "PlaceAmenity" WHERE "locationId" = ${event.locationId}
      `;
    }
    
    return NextResponse.json({
      highlightedAmenities: typedEvent.highlightedAmenities || [],
      locationAmenities
    });
  } catch (error) {
    console.error('Error fetching event amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/amenities - Update highlighted amenities for an event
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const eventId = params.id;
  
  try {
    // Check if user has permission to manage this event
    const events = await prisma.$queryRaw<{ id: string, organizerId: string }[]>`
      SELECT id, "organizerId" FROM "Event" WHERE id = ${eventId}
    `;
    
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = events[0];
    
    // Only the organizer can update amenities for now
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = amenitiesSchema.parse(body);
    
    // Update the event with the new highlighted amenities
    await prisma.$executeRaw`
      UPDATE "Event" 
      SET "highlightedAmenities" = ${JSON.stringify(validatedData.highlightedAmenities)}::jsonb
      WHERE "id" = ${eventId}
    `;
    
    return NextResponse.json({
      message: 'Highlighted amenities updated successfully',
      highlightedAmenities: validatedData.highlightedAmenities
    });
    
  } catch (error) {
    console.error('Error updating event amenities:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update amenities' },
      { status: 500 }
    );
  }
} 