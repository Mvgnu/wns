import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";
import crypto from "crypto";

// Schema for invite creation
const inviteCreateSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  invitedUserId: z.string().min(1, "User ID is required"),
  message: z.string().optional(),
});

// Schema for invite response
const inviteResponseSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
  status: z.enum(["accepted", "rejected"]),
});

// GET handler for retrieving invites
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "received"; // "received" or "sent"
    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status"); // pending, accepted, rejected, or all

    const userId = session.user.id;
    const whereClause: any = {};

    if (type === "received") {
      whereClause.invitedUserId = userId;
    } else if (type === "sent") {
      whereClause.invitedById = userId;
    }

    if (groupId) {
      whereClause.groupId = groupId;
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const invites = await prisma.groupInvite.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            sport: true,
            isPrivate: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        invitedUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST handler for creating new invites
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
    const validatedData = inviteCreateSchema.parse(body);

    // Check if the group exists and the user has permission to invite
    const group = await prisma.group.findUnique({
      where: { id: validatedData.groupId },
      include: {
        members: {
          where: { id: session.user.id },
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

    // Check if the user is a member or owner of the group
    const isMember = group.members.some(member => member.id === session.user.id);
    const isOwner = group.ownerId === session.user.id;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "You must be a member of this group to invite others" },
        { status: 403 }
      );
    }

    // Check if the invited user exists
    const invitedUser = await prisma.user.findUnique({
      where: { id: validatedData.invitedUserId },
      select: { id: true, name: true },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "Invited user not found" },
        { status: 404 }
      );
    }

    // Check if the user is already a member
    const isAlreadyMember = await prisma.group.findFirst({
      where: {
        id: validatedData.groupId,
        OR: [
          { ownerId: validatedData.invitedUserId },
          { members: { some: { id: validatedData.invitedUserId } } },
        ],
      },
    });

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.groupInvite.findUnique({
      where: {
        groupId_invitedUserId: {
          groupId: validatedData.groupId,
          invitedUserId: validatedData.invitedUserId,
        },
      },
    });

    if (existingInvite && existingInvite.status === "pending") {
      return NextResponse.json(
        { error: "There is already a pending invite for this user" },
        { status: 400 }
      );
    }

    // Create or update invite
    const invite = await prisma.groupInvite.upsert({
      where: {
        groupId_invitedUserId: {
          groupId: validatedData.groupId,
          invitedUserId: validatedData.invitedUserId,
        },
      },
      update: {
        status: "pending",
        invitedById: session.user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      create: {
        groupId: validatedData.groupId,
        invitedUserId: validatedData.invitedUserId,
        invitedById: session.user.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notification for invited user
    const notification = await prisma.notification.create({
      data: {
        userId: validatedData.invitedUserId,
        type: "GROUP_INVITE",
        message: `${session.user.name || "Someone"} has invited you to join the group: ${group.name}`,
        read: false,
        relatedId: invite.id,
        linkUrl: `/groups/${group.id}`,
        actorId: session.user.id,
      },
    });

    // Send real-time notification
    sendNotificationToUser(validatedData.invitedUserId, notification);

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// PUT handler for responding to invites
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
    const validatedData = inviteResponseSchema.parse(body);

    // Check if the invite exists and belongs to the user
    const invite = await prisma.groupInvite.findUnique({
      where: { 
        id: validatedData.inviteId,
        invitedUserId: session.user.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or you don't have permission to respond" },
        { status: 404 }
      );
    }

    // Check if invite is still pending
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invite has already been " + invite.status },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Process the invite response
    if (validatedData.status === "accepted") {
      // Add user to group
      await prisma.group.update({
        where: { id: invite.groupId },
        data: {
          members: {
            connect: { id: session.user.id },
          },
        },
      });

      // Create notification for the inviter
      const notification = await prisma.notification.create({
        data: {
          userId: invite.invitedById,
          type: "GROUP_INVITE_ACCEPTED",
          message: `${session.user.name || "Someone"} has accepted your invitation to join ${invite.group.name}`,
          read: false,
          relatedId: invite.groupId,
          linkUrl: `/groups/${invite.groupId}`,
          actorId: session.user.id,
        },
      });

      // Send real-time notification
      sendNotificationToUser(invite.invitedById, notification);
    } else {
      // Create notification for the inviter (rejection)
      const notification = await prisma.notification.create({
        data: {
          userId: invite.invitedById,
          type: "GROUP_INVITE_REJECTED",
          message: `${session.user.name || "Someone"} has declined your invitation to join ${invite.group.name}`,
          read: false,
          relatedId: invite.groupId,
          linkUrl: `/groups/${invite.groupId}`,
          actorId: session.user.id,
        },
      });

      // Send real-time notification
      sendNotificationToUser(invite.invitedById, notification);
    }

    // Update invite status
    const updatedInvite = await prisma.groupInvite.update({
      where: { id: validatedData.inviteId },
      data: { status: validatedData.status },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedInvite);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error responding to invite:", error);
    return NextResponse.json(
      { error: "Failed to respond to invite" },
      { status: 500 }
    );
  }
}

// Generate a invite link for a group
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
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check if the group exists and the user is the owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (group.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can generate invite links" },
        { status: 403 }
      );
    }

    // Generate a unique invite code
    const inviteCode = crypto.randomBytes(6).toString("hex");

    // Update the group with the new invite code
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { inviteCode },
    });

    return NextResponse.json({ 
      inviteCode: updatedGroup.inviteCode,
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/groups/join/${updatedGroup.inviteCode}`
    });
  } catch (error) {
    console.error("Error generating invite link:", error);
    return NextResponse.json(
      { error: "Failed to generate invite link" },
      { status: 500 }
    );
  }
} 