import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DiscountCode } from '@/lib/prisma-extensions';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for updating discount codes
const discountCodeUpdateSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().int().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean().optional()
});

// Validate discount code limits
const validateDiscount = (data: z.infer<typeof discountCodeUpdateSchema>) => {
  if (data.discountType === 'percentage' && data.discountValue && data.discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100%');
  }
  
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    throw new Error('Start date cannot be after end date');
  }
  
  return data;
};

// GET /api/events/[id]/discounts/[codeId] - Get a specific discount code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, codeId: string } }
) {
  const { id: eventId, codeId } = params;
  
  try {
    // Fetch the discount code
    const discountCodes = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM "DiscountCode"
      WHERE "id" = ${codeId} AND "eventId" = ${eventId}
    `;
    
    if (!discountCodes || discountCodes.length === 0) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ discountCode: discountCodes[0] });
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/discounts/[codeId] - Update a discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, codeId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, codeId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only the organizer can update discount codes
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Check if discount code exists
    const discountCodeExists = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM "DiscountCode"
        WHERE "id" = ${codeId} AND "eventId" = ${eventId}
      ) as exists
    `;
    
    if (!discountCodeExists[0].exists) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = discountCodeUpdateSchema.parse(body);
    
    // Additional validation
    validateDiscount(validatedData);
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${updateValues.length + 1}`);
        updateValues.push(value);
      }
    });
    
    // Add updated timestamp
    updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    
    // Only proceed if there are fields to update
    if (updateFields.length === 1) { // Only updatedAt
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update the discount code
    const updateQuery = `
      UPDATE "DiscountCode"
      SET ${updateFields.join(', ')}
      WHERE "id" = $${updateValues.length + 1} AND "eventId" = $${updateValues.length + 2}
      RETURNING *
    `;
    
    updateValues.push(codeId, eventId);
    
    const updatedDiscountCode = await prisma.$queryRawUnsafe(updateQuery, ...updateValues);
    
    return NextResponse.json({
      message: 'Discount code updated successfully',
      discountCode: Array.isArray(updatedDiscountCode) 
        ? updatedDiscountCode[0] 
        : updatedDiscountCode
    });
    
  } catch (error) {
    console.error('Error updating discount code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && 
        error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A discount code with this code already exists for this event' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/discounts/[codeId] - Delete a discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, codeId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, codeId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only the organizer can delete discount codes
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Delete the discount code
    const result = await prisma.$queryRaw`
      DELETE FROM "DiscountCode"
      WHERE "id" = ${codeId} AND "eventId" = ${eventId}
      RETURNING id
    `;
    
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Discount code deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
} 