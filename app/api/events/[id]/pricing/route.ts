import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extendEvent } from '@/lib/prisma-extensions';
import { z } from 'zod';

// Schema validation for event pricing
const pricingSchema = z.object({
  isPaid: z.boolean().default(false),
  price: z.number().optional().nullable(),
  priceCurrency: z.string().optional().nullable(),
  priceDescription: z.string().optional().nullable(),
  maxAttendees: z.number().int().positive().optional().nullable(),
});

// Type definitions for raw query results
type RawEventPricing = {
  id: string;
  isPaid: boolean;
  price: number | null;
  priceCurrency: string | null;
  priceDescription: string | null;
  maxAttendees: number | null;
  isSoldOut: boolean;
  attendeeCount: number;
};

type RawEventBasic = {
  id: string;
  organizerId: string;
};

// GET /api/events/[id]/pricing - Get pricing information for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  try {
    // Use raw query to get event with pricing fields
    const events = await prisma.$queryRaw<RawEventPricing[]>`
      SELECT 
        e.id, 
        e."isPaid", 
        e.price, 
        e."priceCurrency", 
        e."priceDescription", 
        e."maxAttendees", 
        e."isSoldOut",
        (SELECT COUNT(*) FROM "_EventToUser" WHERE "A" = e.id) as "attendeeCount"
      FROM "Event" e
      WHERE e.id = ${eventId}
    `;
    
    const event = events[0];
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Use our helper to ensure proper typing
    const typedEvent = extendEvent(event);
    
    // Calculate if the event is "sold out" based on maxAttendees
    const isSoldOut = typedEvent.maxAttendees !== null && 
                     typedEvent.attendeeCount >= typedEvent.maxAttendees;
    
    return NextResponse.json({
      isPaid: typedEvent.isPaid,
      price: typedEvent.price,
      priceCurrency: typedEvent.priceCurrency,
      priceDescription: typedEvent.priceDescription,
      maxAttendees: typedEvent.maxAttendees,
      currentAttendees: typedEvent.attendeeCount,
      isSoldOut
    });
  } catch (error) {
    console.error('Error fetching event pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing information' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/pricing - Update pricing information for an event
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
    const events = await prisma.$queryRaw<RawEventBasic[]>`
      SELECT 
        e.id, 
        e."organizerId"
      FROM "Event" e
      WHERE e.id = ${eventId}
    `;
    
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = events[0];
    
    // Only the organizer can update pricing
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = pricingSchema.parse(body);
    
    // Prepare the data for update
    const updateData: any = {
      isPaid: validatedData.isPaid
    };
    
    // Only include paid-related fields if the event is paid
    if (validatedData.isPaid) {
      updateData.price = validatedData.price || 0;
      updateData.priceCurrency = validatedData.priceCurrency || 'EUR';
      updateData.priceDescription = validatedData.priceDescription || '';
    } else {
      // Clear pricing fields if the event is free
      updateData.price = null;
      updateData.priceCurrency = null;
      updateData.priceDescription = null;
    }
    
    // Always update maxAttendees if provided
    if (validatedData.maxAttendees !== undefined) {
      updateData.maxAttendees = validatedData.maxAttendees;
    }
    
    // Update the event with the new pricing information using optimized SQL
    const updateFields = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (value === null) {
          return `"${key}" = NULL`;
        } else if (typeof value === 'boolean') {
          return `"${key}" = ${value ? 'TRUE' : 'FALSE'}`;
        } else if (typeof value === 'number') {
          return `"${key}" = ${value}`;
        } else {
          return `"${key}" = '${value}'`;
        }
      })
      .join(', ');
    
    if (updateFields) {
      await prisma.$executeRawUnsafe(`
        UPDATE "Event" 
        SET ${updateFields}
        WHERE "id" = '${eventId}'
      `);
      
      // Also update isSoldOut status if maxAttendees is set
      if (validatedData.maxAttendees !== undefined && validatedData.maxAttendees !== null) {
        await prisma.$executeRaw`
          UPDATE "Event"
          SET "isSoldOut" = (
            SELECT COUNT(*) >= ${validatedData.maxAttendees}
            FROM "_EventToUser"
            WHERE "A" = ${eventId}
          )
          WHERE "id" = ${eventId}
        `;
      }
    }
    
    // Get the updated event to return in response
    const updatedEvents = await prisma.$queryRaw<RawEventPricing[]>`
      SELECT 
        e.id, 
        e."isPaid", 
        e.price, 
        e."priceCurrency", 
        e."priceDescription", 
        e."maxAttendees", 
        e."isSoldOut",
        (SELECT COUNT(*) FROM "_EventToUser" WHERE "A" = e.id) as "attendeeCount"
      FROM "Event" e
      WHERE e.id = ${eventId}
    `;
    
    const updatedEvent = updatedEvents[0];
    const typedUpdatedEvent = extendEvent(updatedEvent);
    
    return NextResponse.json({
      message: 'Pricing information updated successfully',
      pricing: {
        isPaid: typedUpdatedEvent.isPaid,
        price: typedUpdatedEvent.price,
        priceCurrency: typedUpdatedEvent.priceCurrency,
        priceDescription: typedUpdatedEvent.priceDescription,
        maxAttendees: typedUpdatedEvent.maxAttendees,
        currentAttendees: typedUpdatedEvent.attendeeCount,
        isSoldOut: typedUpdatedEvent.isSoldOut
      }
    });
    
  } catch (error) {
    console.error('Error updating event pricing:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update pricing information' },
      { status: 500 }
    );
  }
} 