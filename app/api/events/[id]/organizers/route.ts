import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for adding co-organizers
const coOrganizerSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['co-host', 'assistant', 'moderator', 'support']),
  permissions: z.array(z.enum([
    'edit', 'delete', 'manage-attendees', 'view-analytics', 
    'manage-communications', 'manage-schedule'
  ])),
  notifyUser: z.boolean().default(true)
});

// Schema for bulk operations
const bulkCoOrganizerSchema = z.array(coOrganizerSchema);

// Check if user has permission to manage this event
async function hasEventPermission(userId: string, eventId: string): Promise<boolean> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        groupId: true,
        group: {
          select: {
            ownerId: true,
            admins: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!event) return false;
    
    // User is the main organizer
    if (event.organizerId === userId) return true;
    
    // User is a group admin or owner for the event's group
    if (event.groupId && event.group) {
      if (event.group.ownerId === userId) return true;
      if (event.group.admins.length > 0) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking event permission:', error);
    return false;
  }
}

// GET /api/events/[id]/organizers - Get all co-organizers for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  try {
    // Get the organizer and co-organizers
    const eventOrganizers = await prisma.$queryRaw`
      SELECT 
        eo.id,
        eo."userId",
        eo."eventId",
        eo.role,
        eo.permissions,
        eo."createdAt",
        u.name,
        u.email,
        u.image
      FROM "EventOrganizer" eo
      JOIN "User" u ON u.id = eo."userId"
      WHERE eo."eventId" = ${eventId}
      ORDER BY 
        CASE WHEN eo.role = 'owner' THEN 1
             WHEN eo.role = 'co-host' THEN 2
             WHEN eo.role = 'assistant' THEN 3
             WHEN eo.role = 'moderator' THEN 4
             WHEN eo.role = 'support' THEN 5
             ELSE 6
        END,
        eo."createdAt" ASC
    `;
    
    return NextResponse.json({ organizers: eventOrganizers });
  } catch (error) {
    console.error('Error fetching event organizers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event organizers' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/organizers - Add a co-organizer to an event
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
    
    // Check if the current user is the event organizer or has co-host permissions
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
    
    // Parse request body - can be single organizer or array
    const body = await request.json();
    let coOrganizers = [];
    
    if (Array.isArray(body)) {
      // Bulk add
      coOrganizers = bulkCoOrganizerSchema.parse(body);
    } else {
      // Single add
      coOrganizers = [coOrganizerSchema.parse(body)];
    }
    
    // Process each co-organizer
    const results = [];
    
    for (const coOrganizer of coOrganizers) {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: coOrganizer.userId },
        select: { id: true, email: true, name: true }
      });
      
      if (!user) {
        results.push({
          success: false,
          userId: coOrganizer.userId,
          error: 'User not found'
        });
        continue;
      }
      
      // Check if already an organizer for this event
      const existingOrganizer = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM "EventOrganizer"
          WHERE "eventId" = ${eventId} AND "userId" = ${coOrganizer.userId}
        ) as exists
      `;
      
      if (existingOrganizer[0].exists) {
        results.push({
          success: false,
          userId: coOrganizer.userId,
          error: 'User is already an organizer for this event'
        });
        continue;
      }
      
      // Add the co-organizer
      try {
        const newOrganizer = await prisma.$queryRaw`
          INSERT INTO "EventOrganizer" (
            "id",
            "eventId",
            "userId",
            "role",
            "permissions",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${Prisma.raw('gen_random_uuid()')},
            ${eventId},
            ${coOrganizer.userId},
            ${coOrganizer.role},
            ${Prisma.raw(`ARRAY[${coOrganizer.permissions.map(p => `'${p}'`).join(',')}]::text[]`)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING *
        `;
        
        // TODO: Send notification to user if notifyUser is true
        if (coOrganizer.notifyUser) {
          // This would be implemented with your notification system
          console.log(`Notification sent to ${user.email} about co-organizer role`);
        }
        
        results.push({
          success: true,
          organizer: Array.isArray(newOrganizer) ? newOrganizer[0] : newOrganizer,
          userId: coOrganizer.userId
        });
        
      } catch (insertError) {
        console.error('Error adding co-organizer:', insertError);
        results.push({
          success: false,
          userId: coOrganizer.userId,
          error: 'Failed to add co-organizer'
        });
      }
    }
    
    // Return results
    const allSucceeded = results.every(r => r.success);
    const statusCode = allSucceeded ? 201 : results.some(r => r.success) ? 207 : 400;
    
    return NextResponse.json({ results }, { status: statusCode });
    
  } catch (error) {
    console.error('Error adding co-organizers:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add co-organizers' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/organizers - Remove co-organizers (batch)
export async function DELETE(
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
    
    // Only the primary organizer can remove co-organizers
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Only the primary organizer can remove co-organizers' },
        { status: 403 }
      );
    }
    
    // Get the user IDs to remove
    const { userIds } = await request.json();
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'No user IDs provided for removal' },
        { status: 400 }
      );
    }
    
    // Prevent removing the primary organizer
    if (userIds.includes(event.organizerId)) {
      return NextResponse.json(
        { error: 'Cannot remove the primary organizer' },
        { status: 400 }
      );
    }
    
    // Remove the co-organizers
    const result = await prisma.$queryRaw`
      DELETE FROM "EventOrganizer"
      WHERE "eventId" = ${eventId} 
      AND "userId" IN (${Prisma.join(userIds)})
      AND role != 'owner'
      RETURNING id, "userId"
    `;
    
    return NextResponse.json({
      message: 'Co-organizers removed successfully',
      removed: result
    });
    
  } catch (error) {
    console.error('Error removing co-organizers:', error);
    return NextResponse.json(
      { error: 'Failed to remove co-organizers' },
      { status: 500 }
    );
  }
} 