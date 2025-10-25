import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function resolveParams(paramsOrPromise: any): Promise<{ id?: string }> {
  return typeof paramsOrPromise?.then === 'function' ? await paramsOrPromise : paramsOrPromise || {};
}

// GET handler to fetch a group by ID or slug
export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const { id: groupParam } = await resolveParams(context.params);
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!groupParam) {
      return NextResponse.json(
        { error: "Group ID or slug is required" },
        { status: 400 }
      );
    }

    // First try to find by slug, then by ID for backward compatibility
    let group = await prisma.group.findUnique({
      where: { slug: groupParam },
    });

    // If not found by slug, try by ID
    if (!group) {
      group = await prisma.group.findUnique({
        where: { id: groupParam },
      });
    }

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check privacy settings
    if (group.isPrivate) {
      // If not logged in, deny access
      if (!userId) {
        return NextResponse.json(
          { error: "You must be logged in to view this private group" },
          { status: 401 }
        );
      }

      // Check if the user is a member or owner
      const isOwner = group.ownerId === userId;

      if (!isOwner) {
        const memberCheck = await prisma.group.findFirst({
          where: {
            id: group.id,
            members: { some: { id: userId } },
          },
        });

        if (!memberCheck) {
          return NextResponse.json(
            { error: "You must be a member to view this private group" },
            { status: 403 }
          );
        }
      }
    }

    // Now fetch the full group details with related data
    const fullGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        owner: {
          select: { id: true, name: true, image: true },
        },
        members: {
          select: { id: true, name: true, image: true },
          take: 10, // Limit number of members returned
        },
        _count: {
          select: { members: true, posts: true, events: true },
        },
      },
    });

    // Determine if current user is a member or owner
    let isMember = false;
    let isOwner = false;

    if (userId) {
      isOwner = group.ownerId === userId;
      if (fullGroup?.members) {
        isMember = fullGroup.members.some(member => member.id === userId);
      }
    }

    // Add membership status and privacy to response
    const responseGroup = {
      ...fullGroup,
      isMember,
      isOwner,
      isPrivate: group.isPrivate,
      inviteCode: isOwner ? group.inviteCode : undefined, // Only send invite code to owner
    };

    return NextResponse.json(responseGroup);
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PUT handler to update a group by ID or slug
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupParam } = await context.params;
    if (!groupParam) {
      return NextResponse.json({ error: "Group ID or slug is required" }, { status: 400 });
    }

    // Find the group first (by slug or ID)
    let group = await prisma.group.findUnique({
      where: { slug: groupParam },
    });

    if (!group) {
      group = await prisma.group.findUnique({
        where: { id: groupParam },
      });
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.group.update({
      where: { id: group.id },
      data: body,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE handler to delete a group by ID or slug
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupParam } = await context.params;
    if (!groupParam) {
      return NextResponse.json({ error: "Group ID or slug is required" }, { status: 400 });
    }

    // Find the group first (by slug or ID)
    let group = await prisma.group.findUnique({
      where: { slug: groupParam },
    });

    if (!group) {
      group = await prisma.group.findUnique({
        where: { id: groupParam },
      });
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.group.delete({ where: { id: group.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
} 