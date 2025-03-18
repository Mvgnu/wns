export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Schema for group creation
const groupCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  image: z.union([
    z.string().url({ message: "Image must be a valid URL" }),
    z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null().transform(() => undefined)
  ]).optional(),
  sport: z.string().min(1, "Sport is required"),
  location: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

// Schema for group update
const groupUpdateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional(),
  image: z.union([
    z.string().url({ message: "Image must be a valid URL" }),
    z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null().transform(() => undefined)
  ]).optional(),
  sport: z.string().min(1, "Sport is required").optional(),
  location: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

// Schema for member operations
const memberOperationSchema = z.object({
  operation: z.enum(["join", "leave", "remove"]),
  userId: z.string().optional(), // Required for 'remove' operation
});

// GET handler for fetching groups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport");
    
    // Base query for getting groups
    let whereClause: any = {};
    
    // Filter by sport if provided
    if (sport) {
      whereClause.sport = sport;
    }
    
    // Filter for privacy
    if (!userId) {
      // If not logged in, only show public groups
      whereClause.isPrivate = false;
    } else {
      // If logged in, show public groups and private groups where the user is a member
      whereClause = {
        OR: [
          { isPrivate: false },
          { 
            isPrivate: true,
            OR: [
              { ownerId: userId },
              { members: { some: { id: userId } } }
            ]
          }
        ]
      };
    }
    
    const groups = await prisma.group.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          },
        },
      },
    });
    
    // For each group, check if the current user is a member
    const groupsWithMemberStatus = await Promise.all(
      groups.map(async (group) => {
        let isMember = false;
        
        if (userId) {
          const membership = await prisma.group.count({
            where: {
              id: group.id,
              OR: [
                { ownerId: userId },
                { members: { some: { id: userId } } },
              ],
            },
          });
          
          isMember = membership > 0;
        }
        
        return {
          ...group,
          isMember,
        };
      })
    );
    
    return NextResponse.json(groupsWithMemberStatus);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST handler for creating new groups
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Group creation request body:", JSON.stringify(body, null, 2));
    
    try {
      const validatedData = groupCreateSchema.parse(body);
      console.log("Validated group data:", JSON.stringify(validatedData, null, 2));

      // Create the group
      const group = await prisma.group.create({
        data: {
          ...validatedData,
          ownerId: session.user.id,
          members: {
            connect: { id: session.user.id }, // Owner is automatically a member
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      console.log("Group created successfully:", JSON.stringify(group, null, 2));
      return NextResponse.json(group, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Group validation error:", JSON.stringify(validationError.errors, null, 2));
        return NextResponse.json(
          { error: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}

// PUT handler for updating groups
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const validatedData = groupUpdateSchema.parse(updateData);

    // Check if the group exists and belongs to the user
    const existingGroup = await prisma.group.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (existingGroup.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update groups you own" },
        { status: 403 }
      );
    }

    // Update the group
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing groups
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check if the group exists and belongs to the user
    const existingGroup = await prisma.group.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (existingGroup.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete groups you own" },
        { status: 403 }
      );
    }

    // Delete associated posts, comments, and likes first
    const groupPosts = await prisma.post.findMany({
      where: { groupId: id },
      select: { id: true },
    });

    const postIds = groupPosts.map(post => post.id);

    await prisma.$transaction([
      // Delete comments on group posts
      prisma.comment.deleteMany({
        where: { postId: { in: postIds } },
      }),
      // Delete likes on group posts
      prisma.like.deleteMany({
        where: { postId: { in: postIds } },
      }),
      // Delete group posts
      prisma.post.deleteMany({
        where: { groupId: id },
      }),
      // Delete group events
      prisma.event.deleteMany({
        where: { groupId: id },
      }),
      // Delete the group
      prisma.group.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}

// PATCH handler for member operations (join/leave/remove)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...operationData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const validatedOperation = memberOperationSchema.parse(operationData);
    const { operation, userId } = validatedOperation;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    switch (operation) {
      case "join":
        // Check if the user is already a member
        if (group.members.some((member: { id: string }) => member.id === session.user.id)) {
          return NextResponse.json(
            { error: "You are already a member of this group" },
            { status: 400 }
          );
        }

        // Add the user to the group members
        await prisma.group.update({
          where: { id },
          data: {
            members: {
              connect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ success: true, operation: "joined" });

      case "leave":
        // Check if the user is the owner
        if (group.ownerId === session.user.id) {
          return NextResponse.json(
            { error: "Group owners cannot leave. Transfer ownership or delete the group." },
            { status: 400 }
          );
        }

        // Check if the user is a member
        if (!group.members.some((member: { id: string }) => member.id === session.user.id)) {
          return NextResponse.json(
            { error: "You are not a member of this group" },
            { status: 400 }
          );
        }

        // Remove the user from the group members
        await prisma.group.update({
          where: { id },
          data: {
            members: {
              disconnect: { id: session.user.id },
            },
          },
        });

        return NextResponse.json({ success: true, operation: "left" });

      case "remove":
        // Check if the user is the owner
        if (group.ownerId !== session.user.id) {
          return NextResponse.json(
            { error: "Only group owners can remove members" },
            { status: 403 }
          );
        }

        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for the remove operation" },
            { status: 400 }
          );
        }

        // Check if the user is trying to remove themselves
        if (userId === session.user.id) {
          return NextResponse.json(
            { error: "Owners cannot remove themselves. Transfer ownership or delete the group." },
            { status: 400 }
          );
        }

        // Check if the user is a member
        if (!group.members.some((member: { id: string }) => member.id === userId)) {
          return NextResponse.json(
            { error: "The user is not a member of this group" },
            { status: 400 }
          );
        }

        // Remove the specified user from the group members
        await prisma.group.update({
          where: { id },
          data: {
            members: {
              disconnect: { id: userId },
            },
          },
        });

        return NextResponse.json({ success: true, operation: "removed" });

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
    
    console.error("Error performing group member operation:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
} 