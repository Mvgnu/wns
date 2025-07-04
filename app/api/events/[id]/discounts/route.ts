import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DiscountCode } from '@/lib/prisma-extensions';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for creating/updating discount codes
const discountCodeSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean().default(true)
});

// Validate discount code limits
const validateDiscount = (data: z.infer<typeof discountCodeSchema>) => {
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100%');
  }
  
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    throw new Error('Start date cannot be after end date');
  }
  
  return data;
};

// GET /api/events/[id]/discounts - Get all discount codes for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  try {
    // Fetch discount codes for the event
    const discountCodes = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM "DiscountCode"
      WHERE "eventId" = ${eventId}
      ORDER BY "createdAt" DESC
    `;
    
    return NextResponse.json({ discountCodes });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/discounts - Create a new discount code
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
    
    // Only the organizer can add discount codes
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = discountCodeSchema.parse(body);
    
    // Additional validation
    validateDiscount(validatedData);
    
    // Create the discount code
    try {
      const discountCode = await prisma.$queryRaw`
        INSERT INTO "DiscountCode" (
          "id",
          "eventId",
          "code",
          "discountType",
          "discountValue",
          "maxUses",
          "currentUses",
          "startDate",
          "endDate",
          "isActive",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${Prisma.raw('gen_random_uuid()')},
          ${eventId},
          ${validatedData.code},
          ${validatedData.discountType},
          ${validatedData.discountValue},
          ${validatedData.maxUses},
          0,
          ${validatedData.startDate},
          ${validatedData.endDate},
          ${validatedData.isActive},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;
      
      return NextResponse.json({
        message: 'Discount code created successfully',
        discountCode: Array.isArray(discountCode) ? discountCode[0] : discountCode
      }, { status: 201 });
      
    } catch (insertError) {
      // Check for duplicate code
      if (insertError instanceof Prisma.PrismaClientKnownRequestError && 
          insertError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A discount code with this code already exists for this event' },
          { status: 409 }
        );
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error creating discount code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create discount code' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/discounts/validate?code=X - Validate a discount code
export async function GET_VALIDATE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  const { searchParams } = new URL(request.url);
  const codeParam = searchParams.get('code');
  
  if (!codeParam) {
    return NextResponse.json(
      { error: 'Discount code is required' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the discount code
    const discountCodes = await prisma.$queryRaw<DiscountCode[]>`
      SELECT * FROM "DiscountCode"
      WHERE "eventId" = ${eventId} AND "code" = ${codeParam} AND "isActive" = true
    `;
    
    if (!discountCodes || discountCodes.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid discount code'
      });
    }
    
    const discountCode = discountCodes[0];
    const now = new Date();
    
    // Check date validity
    if ((discountCode.startDate && discountCode.startDate > now) || 
        (discountCode.endDate && discountCode.endDate < now)) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code is not currently valid',
        code: {
          ...discountCode,
          valid: false,
          invalidReason: 'date'
        }
      });
    }
    
    // Check usage limits
    if (discountCode.maxUses !== null && discountCode.currentUses >= discountCode.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code has reached maximum usage',
        code: {
          ...discountCode,
          valid: false,
          invalidReason: 'maxUses'
        }
      });
    }
    
    // Code is valid
    return NextResponse.json({
      valid: true,
      message: 'Valid discount code',
      code: {
        ...discountCode,
        valid: true
      }
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
} 