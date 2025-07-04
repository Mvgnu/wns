import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

// GET handler to fetch members of a group
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const groupId = params.id;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { 
        id: true,
        ownerId: true,
        isPrivate: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if the user is an admin of the group
    let isUserAdmin = false;
    if (userId) {
      const admin = await prisma.groupAdmin.findFirst({
        where: {
          groupId,
          userId,
        },
      });
      isUserAdmin = !!admin || group.ownerId === userId;
    }

    // If the group is private and the user is not a member, return error
    if (group.isPrivate && userId) {
      const isMember = await prisma.group.findFirst({
        where: {
          id: groupId,
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } },
          ],
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: "You do not have permission to view members of this private group" },
          { status: 403 }
        );
      }
    }

    // Fetch members with their roles and status
    const members = await prisma.user.findMany({
      where: {
        OR: [
          { id: group.ownerId },
          { memberGroups: { some: { id: groupId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        groupMemberStatuses: {
          where: { groupId },
          select: {
            status: true,
            isAnonymous: true,
          },
        },
        groupMemberRoles: {
          where: { groupId },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    // Check if user is admin/owner to determine what information to show
    const isRequesterAdminOrOwner = isUserAdmin || group.ownerId === userId;

    // Process member data to include roles and respect anonymity
    const processedMembers = members.map(member => {
      const status = member.groupMemberStatuses[0];
      const isAnonymous = status?.isAnonymous || false;
      const isOwner = member.id === group.ownerId;
      
      // For anonymous members: hide personal details unless the requester is admin/owner
      // or the member is viewing their own profile
      const shouldHideDetails = isAnonymous && 
                               !isRequesterAdminOrOwner && 
                               member.id !== userId;
      
      // Everyone can see the owner's details
      const finalHideDetails = isOwner ? false : shouldHideDetails;

      return {
        id: member.id,
        name: finalHideDetails ? null : member.name,
        image: finalHideDetails ? null : member.image,
        email: isRequesterAdminOrOwner ? member.email : null, // Only admins see emails
        isAnonymous: isAnonymous,
        isOwner: isOwner,
        role: member.groupMemberRoles[0]?.role?.name || (isOwner ? "owner" : "member"),
      };
    });

    return NextResponse.json({ members: processedMembers });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
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
    
    // Parse request body to get isAnonymous flag
    const body = await req.json().catch(() => ({}));
    const isAnonymous = !!body.isAnonymous;

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

    // Add user to the group and create/update the member status
    await prisma.$transaction([
      // Add user to the group
      prisma.group.update({
        where: { id: groupId },
        data: {
          members: {
            connect: { id: userId },
          },
          memberCount: {
            increment: 1
          }
        },
      }),
      
      // Create or update member status with anonymous flag
      prisma.groupMemberStatus.upsert({
        where: {
          groupId_userId: {
            groupId,
            userId
          }
        },
        create: {
          groupId,
          userId,
          status: "active",
          joinedAt: new Date(),
          isAnonymous: isAnonymous
        },
        update: {
          status: "active",
          joinedAt: new Date(),
          isAnonymous: isAnonymous
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      isMember: true,
      isAnonymous: isAnonymous
    });
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