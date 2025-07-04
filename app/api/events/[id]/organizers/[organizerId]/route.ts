import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for updating co-organizers
const coOrganizerUpdateSchema = z.object({
  role: z.enum(['co-host', 'assistant', 'moderator', 'support']).optional(),
  permissions: z.array(z.enum([
    'edit', 'delete', 'manage-attendees', 'view-analytics', 
    'manage-communications', 'manage-schedule'
  ])).optional()
});

// GET /api/events/[id]/organizers/[organizerId] - Get a specific co-organizer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, organizerId: string } }
) {
  const { id: eventId, organizerId } = params;
  
  try {
    // Fetch the co-organizer
    const organizer = await prisma.$queryRaw`
      SELECT 
        eo.id,
        eo."userId",
        eo."eventId",
        eo.role,
        eo.permissions,
        eo."createdAt",
        eo."updatedAt",
        u.name,
        u.email,
        u.image
      FROM "EventOrganizer" eo
      JOIN "User" u ON u.id = eo."userId"
      WHERE eo."id" = ${organizerId} AND eo."eventId" = ${eventId}
    `;
    
    if (!organizer || (Array.isArray(organizer) && organizer.length === 0)) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ organizer: Array.isArray(organizer) ? organizer[0] : organizer });
  } catch (error) {
    console.error('Error fetching organizer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizer' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id]/organizers/[organizerId] - Update a co-organizer's role/permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, organizerId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, organizerId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if the current user is the event owner or has co-host permissions
    const hasPermission = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "Event" e
        LEFT JOIN "EventOrganizer" eo ON e.id = eo."eventId" AND eo."userId" = ${userId}
        WHERE e.id = ${eventId} AND (
          e."organizerId" = ${userId} OR 
          (eo.role = 'co-host' AND 'edit' = ANY(eo.permissions))
        )
      ) as exists
    `;
    
    if (!hasPermission[0].exists) {
      return NextResponse.json(
        { error: 'You do not have permission to manage organizers for this event' },
        { status: 403 }
      );
    }
    
    // Get the organizer to update
    const existingOrganizer = await prisma.$queryRaw`
      SELECT * FROM "EventOrganizer"
      WHERE "id" = ${organizerId} AND "eventId" = ${eventId}
    `;
    
    if (!existingOrganizer || (Array.isArray(existingOrganizer) && existingOrganizer.length === 0)) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }
    
    const organizerData = Array.isArray(existingOrganizer) ? existingOrganizer[0] : existingOrganizer;
    
    // Prevent updating the owner
    if (organizerData.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify the primary event owner' },
        { status: 400 }
      );
    }
    
    // Prevent regular co-hosts from modifying other co-hosts
    if (userId !== event.organizerId && organizerData.role === 'co-host') {
      return NextResponse.json(
        { error: 'Only the primary organizer can modify co-hosts' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = coOrganizerUpdateSchema.parse(body);
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (validatedData.role !== undefined) {
      updateFields.push(`"role" = $${updateValues.length + 1}`);
      updateValues.push(validatedData.role);
    }
    
    if (validatedData.permissions !== undefined) {
      updateFields.push(`"permissions" = $${updateValues.length + 1}`);
      updateValues.push(validatedData.permissions);
    }
    
    // Add updated timestamp
    updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    
    // Only proceed if there are fields to update
    if (updateFields.length === 1) { // Only updatedAt
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update the organizer
    const updateQuery = `
      UPDATE "EventOrganizer"
      SET ${updateFields.join(', ')}
      WHERE "id" = $${updateValues.length + 1} AND "eventId" = $${updateValues.length + 2}
      RETURNING *
    `;
    
    updateValues.push(organizerId, eventId);
    
    const updatedOrganizer = await prisma.$queryRawUnsafe(updateQuery, ...updateValues);
    
    return NextResponse.json({
      message: 'Organizer updated successfully',
      organizer: Array.isArray(updatedOrganizer) ? updatedOrganizer[0] : updatedOrganizer
    });
    
  } catch (error) {
    console.error('Error updating organizer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update organizer' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/organizers/[organizerId] - Remove a specific co-organizer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, organizerId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const { id: eventId, organizerId } = params;
  
  try {
    // Check if user has permission to manage this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if the current user is the event owner
    const isOwner = event.organizerId === userId;
    
    if (!isOwner) {
      // Only the owner can remove co-hosts
      const organizerToDelete = await prisma.$queryRaw`
        SELECT role FROM "EventOrganizer"
        WHERE "id" = ${organizerId} AND "eventId" = ${eventId}
      `;
      
      if (Array.isArray(organizerToDelete) && organizerToDelete.length > 0 && 
          organizerToDelete[0].role === 'co-host') {
        return NextResponse.json(
          { error: 'Only the primary organizer can remove co-hosts' },
          { status: 403 }
        );
      }
      
      // Check if the current user is a co-host with the right permissions
      const hasPermission = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM "EventOrganizer"
          WHERE "eventId" = ${eventId} AND "userId" = ${userId}
          AND role = 'co-host' AND 'edit' = ANY(permissions)
        ) as exists
      `;
      
      if (!hasPermission[0].exists) {
        return NextResponse.json(
          { error: 'You do not have permission to remove organizers' },
          { status: 403 }
        );
      }
    }
    
    // Check if the organizer to delete exists and is not the owner
    const organizerExists = await prisma.$queryRaw<{ exists: boolean, isOwner: boolean }[]>`
      SELECT 
        EXISTS (
          SELECT 1 FROM "EventOrganizer"
          WHERE "id" = ${organizerId} AND "eventId" = ${eventId}
        ) as exists,
        EXISTS (
          SELECT 1 FROM "EventOrganizer"
          WHERE "id" = ${organizerId} AND "eventId" = ${eventId} AND role = 'owner'
        ) as "isOwner"
    `;
    
    if (!organizerExists[0].exists) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }
    
    if (organizerExists[0].isOwner) {
      return NextResponse.json(
        { error: 'Cannot remove the primary event owner' },
        { status: 400 }
      );
    }
    
    // Remove the organizer
    const result = await prisma.$queryRaw`
      DELETE FROM "EventOrganizer"
      WHERE "id" = ${organizerId} AND "eventId" = ${eventId}
      RETURNING id
    `;
    
    return NextResponse.json({
      message: 'Organizer removed successfully',
      removed: result
    });
    
  } catch (error) {
    console.error('Error removing organizer:', error);
    return NextResponse.json(
      { error: 'Failed to remove organizer' },
      { status: 500 }
    );
  }
} 