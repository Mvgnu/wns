export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeServerSession } from "@/lib/sessionHelper";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

function isPromiseLike<T>(x: any): x is Promise<T> { return typeof x?.then === 'function'; }
async function resolveParams(paramsOrPromise: any): Promise<{ id?: string }> {
  return isPromiseLike(paramsOrPromise) ? await paramsOrPromise : paramsOrPromise || {};
}

// GET handler for retrieving a single event by ID
export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const { id: eventId } = await resolveParams(context.params);
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Use safe session helper to get the current user
    const session = await getSafeServerSession();
    const userId = session?.user?.id;
    
    // First check if the event exists and if it belongs to a private group
    const eventWithGroup = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        groupId: true,
        group: {
          select: {
            isPrivate: true,
            ownerId: true,
            members: {
              select: { id: true },
              where: userId ? { id: userId } : undefined
            }
          }
        }
      }
    });
    
    if (!eventWithGroup) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if this is a private group event
    if (eventWithGroup.group?.isPrivate) {
      // If not logged in, deny access to private group events
      if (!userId) {
        return NextResponse.json(
          { error: "This event belongs to a private group" },
          { status: 403 }
        );
      }
      
      // Check if the user is the owner of the group
      const isGroupOwner = eventWithGroup.group.ownerId === userId;
      
      // Check if the user is a member of the group
      const isGroupMember = eventWithGroup.group.members.length > 0;
      
      // If not owner or member, deny access
      if (!isGroupOwner && !isGroupMember) {
        return NextResponse.json(
          { error: "This event belongs to a private group you're not a member of" },
          { status: 403 }
        );
      }
    }
    
    // Fetch the event with related data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: { id: true, name: true, image: true } },
        group: {
          select: {
            id: true,
            name: true,
            sport: true,
            image: true,
            isPrivate: true,
            members: { select: { id: true } },
            _count: { select: { members: true } }
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            isLineBased: true,
            coordinates: true,
          },
        },
        attendees: { select: { id: true, name: true, image: true }, take: 20 },
        _count: { select: { attendees: true } },
      },
    });
    
    // Check if the current user is attending
    let attendance = { isAttending: false, isOrganizer: false };
    
    if (session?.user && event) {
      attendance.isOrganizer = event.organizerId === userId;
      
      if (!attendance.isOrganizer) {
        // Check if user is in attendees
        const attendee = await prisma.event.findFirst({
          where: { id: eventId, attendees: { some: { id: userId } } },
        });
        attendance.isAttending = !!attendee;
      } else {
        attendance.isAttending = true; // Organizer is automatically attending
      }
    }
    
    return NextResponse.json({ ...event, attendance });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting an event
export async function DELETE(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id: eventId } = await resolveParams(context.params);
    
    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, groupId: true },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the organizer or group owner if the event is part of a group
    const userId = session.user.id;
    let hasPermission = event.organizerId === userId;
    
    if (!hasPermission && event.groupId) {
      // Check if user is the group owner
      const group = await prisma.group.findUnique({
        where: { id: event.groupId },
        select: { ownerId: true },
      });
      
      hasPermission = group?.ownerId === userId;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }
    
    // Delete the event
    await prisma.event.delete({ where: { id: eventId } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: any }) {
  // Delegate to PATCH logic for compatibility
  return PATCH(req, context as any)
}

export async function PATCH(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: eventId } = await resolveParams(context.params)
    const userId = session.user.id;

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, groupId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let hasPermission = existing.organizerId === userId;
    if (!hasPermission && existing.groupId) {
      const group = await prisma.group.findUnique({ where: { id: existing.groupId }, select: { ownerId: true } });
      hasPermission = group?.ownerId === userId;
    }
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.event.update({ where: { id: eventId }, data: body });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
} 