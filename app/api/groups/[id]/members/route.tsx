'use server';

export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define Group type with isPrivate
type Group = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sport: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isPrivate: boolean;
  inviteCode: string | null;
};

// Schema for member operations
const memberOperationSchema = z.object({
  operation: z.enum(["join", "leave", "remove"]),
  userId: z.string().optional(), // Required for 'remove' operation
});

// GET handler to check if a user is a member of the group
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const groupId = params.id;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member
    const membership = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    return NextResponse.json({ isMember: !!membership });
  } catch (error) {
    console.error("Error checking membership:", error);
    return NextResponse.json(
      { error: "Failed to check membership" },
      { status: 500 }
    );
  }
}

// POST handler for direct member join (public groups)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const groupId = params.id;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if the group is private (using a type-safe approach)
    const isPrivate = Boolean(group && 'isPrivate' in group && group.isPrivate);
    if (isPrivate) {
      return NextResponse.json(
        { error: "This is a private group. Please send a join request instead." },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const membership = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (membership) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      );
    }

    // Add user to the group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    });

    return NextResponse.json({ success: true, isMember: true });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}

// PUT handler for member operations (join, leave, remove)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const groupId = params.id;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { owner: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { operation, userId } = memberOperationSchema.parse(body);

    // Different operations
    switch (operation) {
      case "join": {
        // Check if user is already a member
        const membership = await prisma.group.findFirst({
          where: {
            id: groupId,
            members: {
              some: {
                id: session.user.id,
              },
            },
          },
        });

        if (membership) {
          return NextResponse.json(
            { error: "You are already a member of this group" },
            { status: 400 }
          );
        }

        // Add user to the group
        await prisma.group.update({
          where: { id: groupId },
          data: {
            members: {
              connect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ success: true });
      }

      case "leave": {
        // Check if user is trying to leave as the owner
        if (group.owner.id === session.user.id) {
          return NextResponse.json(
            { error: "Group owners cannot leave their own group; transfer ownership first" },
            { status: 400 }
          );
        }

        // Check if user is a member
        const membership = await prisma.group.findFirst({
          where: {
            id: groupId,
            members: {
              some: {
                id: session.user.id,
              },
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You are not a member of this group" },
            { status: 400 }
          );
        }

        // Remove user from the group
        await prisma.group.update({
          where: { id: groupId },
          data: {
            members: {
              disconnect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ success: true });
      }

      case "remove": {
        // Check if the current user is the owner
        if (group.owner.id !== session.user.id) {
          return NextResponse.json(
            { error: "Only group owners can remove members" },
            { status: 403 }
          );
        }

        // Check if the user to remove exists and is provided
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for remove operation" },
            { status: 400 }
          );
        }

        // Check if the user to remove is a member
        const membership = await prisma.group.findFirst({
          where: {
            id: groupId,
            members: {
              some: {
                id: userId,
              },
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "User is not a member of this group" },
            { status: 400 }
          );
        }

        // Remove user from the group
        await prisma.group.update({
          where: { id: groupId },
          data: {
            members: {
              disconnect: { id: userId },
            },
          },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error managing group members:", error);
    return NextResponse.json(
      { error: "Failed to perform member operation" },
      { status: 500 }
    );
  }
}

// DELETE handler for leaving a group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) {
      return new Response(JSON.stringify({ error: "Group ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is the owner - owners can't leave their own group
    if (group.ownerId === userId) {
      return new Response(
        JSON.stringify({
          error: "Group owners cannot leave their own group. Transfer ownership first or delete the group.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is actually a member
    const isMember = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: { some: { id: userId } },
      },
    });

    if (!isMember) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this group" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove the user from the group's members
    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    // Also check if user is a group admin and remove them if necessary
    const isAdmin = await prisma.groupAdmin.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (isAdmin) {
      await prisma.groupAdmin.delete({
        where: {
          id: isAdmin.id,
        },
      });
    }

    // Notify the group owner
    await prisma.notification.create({
      data: {
        type: "GROUP_MEMBER_LEFT",
        message: `${session.user.name || "A user"} has left your group "${group.name}"`,
        userId: group.ownerId,
        actorId: userId,
        read: false,
        linkUrl: `/groups/${groupId}`,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return new Response(
      JSON.stringify({ error: "Failed to leave group" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 