import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation for updating pricing tiers
const pricingTierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.number().int().nonnegative().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean().optional()
});

// GET /api/events/[id]/pricing/tiers/[tierId] - Get a specific pricing tier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  const { id: eventId, tierId } = params;
  
  try {
    // Fetch the pricing tier
    const tier = await prisma.$queryRaw`
      SELECT * FROM "PricingTier"
      WHERE "id" = ${tierId} AND "eventId" = ${eventId}
    `;
    
    if (!tier || (Array.isArray(tier) && tier.length === 0)) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      tier: Array.isArray(tier) ? tier[0] : tier
    });
  } catch (error) {
    console.error('Error fetching pricing tier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing tier' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/pricing/tiers/[tierId] - Update a pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, tierId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only the organizer can update pricing tiers
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Check if the tier exists
    const existingTier = await prisma.$queryRaw`
      SELECT * FROM "PricingTier"
      WHERE "id" = ${tierId} AND "eventId" = ${eventId}
    `;
    
    if (!existingTier || (Array.isArray(existingTier) && existingTier.length === 0)) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = pricingTierSchema.parse(body);
    
    // Build update SQL based on provided fields
    const updates = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (validatedData.name !== undefined) {
      updates.push(`"name" = $${paramIndex}`);
      values.push(validatedData.name);
      paramIndex++;
    }
    
    if (validatedData.description !== undefined) {
      updates.push(`"description" = $${paramIndex}`);
      values.push(validatedData.description);
      paramIndex++;
    }
    
    if (validatedData.price !== undefined) {
      updates.push(`"price" = $${paramIndex}`);
      values.push(validatedData.price);
      paramIndex++;
    }
    
    if (validatedData.capacity !== undefined) {
      updates.push(`"capacity" = $${paramIndex}`);
      values.push(validatedData.capacity);
      paramIndex++;
    }
    
    if (validatedData.startDate !== undefined) {
      updates.push(`"startDate" = $${paramIndex}`);
      values.push(validatedData.startDate);
      paramIndex++;
    }
    
    if (validatedData.endDate !== undefined) {
      updates.push(`"endDate" = $${paramIndex}`);
      values.push(validatedData.endDate);
      paramIndex++;
    }
    
    if (validatedData.isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex}`);
      values.push(validatedData.isActive);
      paramIndex++;
    }
    
    // Always update updatedAt
    updates.push(`"updatedAt" = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;
    
    // Add WHERE conditions
    values.push(tierId);
    values.push(eventId);
    
    // Execute update if there are fields to update
    if (updates.length > 0) {
      const sql = `
        UPDATE "PricingTier"
        SET ${updates.join(', ')}
        WHERE "id" = $${paramIndex} AND "eventId" = $${paramIndex + 1}
        RETURNING *
      `;
      
      const updatedTier = await prisma.$queryRawUnsafe(sql, ...values);
      
      return NextResponse.json({
        message: 'Pricing tier updated successfully',
        tier: Array.isArray(updatedTier) ? updatedTier[0] : updatedTier
      });
    } else {
      // No updates provided
      return NextResponse.json({
        message: 'No changes to apply',
        tier: Array.isArray(existingTier) ? existingTier[0] : existingTier
      });
    }
  } catch (error) {
    console.error('Error updating pricing tier:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update pricing tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/pricing/tiers/[tierId] - Delete a pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, tierId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only the organizer can delete pricing tiers
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Check if the tier exists
    const existingTier = await prisma.$queryRaw`
      SELECT * FROM "PricingTier"
      WHERE "id" = ${tierId} AND "eventId" = ${eventId}
    `;
    
    if (!existingTier || (Array.isArray(existingTier) && existingTier.length === 0)) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }
    
    // Delete the pricing tier
    await prisma.$executeRaw`
      DELETE FROM "PricingTier"
      WHERE "id" = ${tierId} AND "eventId" = ${eventId}
    `;
    
    return NextResponse.json({
      message: 'Pricing tier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pricing tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing tier' },
      { status: 500 }
    );
  }
} 