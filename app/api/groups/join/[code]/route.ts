import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";

// GET handler to check if an invite code is valid
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    
    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }
    
    // Find the group with this invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
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
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!group) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 404 }
      );
    }
    
    // Check if the user is logged in and already a member
    const session = await getServerSession(authOptions);
    let isMember = false;
    
    if (session?.user) {
      const memberCheck = await prisma.group.findFirst({
        where: {
          id: group.id,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } },
          ],
        },
      });
      
      isMember = !!memberCheck;
    }
    
    return NextResponse.json({
      group,
      isMember,
    });
  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}

// POST handler to join a group through an invite code
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to join a group" },
        { status: 401 }
      );
    }
    
    const code = params.code;
    
    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }
    
    // Find the group with this invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
    });
    
    if (!group) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 404 }
      );
    }
    
    // Check if user is already a member
    const isMember = await prisma.group.findFirst({
      where: {
        id: group.id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
    });
    
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      );
    }
    
    // Add user to the group
    await prisma.group.update({
      where: { id: group.id },
      data: {
        members: {
          connect: { id: session.user.id },
        },
      },
    });
    
    // Create notification for the group owner
    const notification = await prisma.notification.create({
      data: {
        userId: group.ownerId,
        type: "GROUP_JOIN",
        message: `${session.user.name || "Someone"} joined your group using an invite link`,
        read: false,
        relatedId: group.id,
        linkUrl: `/groups/${group.id}`,
        actorId: session.user.id,
      },
    });
    
    // Send real-time notification
    sendNotificationToUser(group.ownerId, notification);
    
    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
      },
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
} 