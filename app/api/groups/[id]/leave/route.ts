export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";

// POST handler for leaving a group
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the group ID from the route parameters
    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { id: userId },
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

    // Cannot leave if you're the owner
    if (group.ownerId === userId) {
      return NextResponse.json(
        { error: "Group owners cannot leave their own group. Please transfer ownership or delete the group instead." },
        { status: 400 }
      );
    }

    // Check if the user is a member of the group
    const isMember = group.members.some(member => member.id === userId);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 400 }
      );
    }

    // Remove the user from the group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    // Create notification for the group owner
    const notification = await prisma.notification.create({
      data: {
        userId: group.ownerId,
        type: "GROUP_LEAVE",
        message: `${session.user.name || "Someone"} has left your group: ${group.name}`,
        read: false,
        relatedId: groupId,
        linkUrl: `/groups/${groupId}`,
        actorId: userId,
      },
    });

    // Send real-time notification
    sendNotificationToUser(group.ownerId, notification);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
} 