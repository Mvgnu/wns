import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extendEvent, PricingTier } from '@/lib/prisma-extensions';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for creating/updating pricing tiers
const pricingTierSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  price: z.number().int().nonnegative(),
  capacity: z.number().int().positive().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean().default(true)
});

// GET /api/events/[id]/pricing/tiers - Get all pricing tiers for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  try {
    // Fetch pricing tiers for the event
    const pricingTiers = await prisma.pricingTier.findMany({
      where: { eventId },
      orderBy: { price: 'asc' }
    });
    
    return NextResponse.json({ pricingTiers });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/pricing/tiers - Create a new pricing tier
export async function POST(
  request: NextRequest,
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
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only the organizer can add pricing tiers
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = pricingTierSchema.parse(body);
    
    // Create the pricing tier
    const tier = await prisma.pricingTier.create({
      data: {
        ...validatedData,
        eventId
      }
    });
    
    return NextResponse.json({
      message: 'Pricing tier created successfully',
      tier
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A pricing tier with this name already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create pricing tier' },
      { status: 500 }
    );
  }
} 