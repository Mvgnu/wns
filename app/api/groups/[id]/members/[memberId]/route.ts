export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE handler for removing a member from a group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, memberId } = params;
    const groupId = id; // For backward compatibility

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true
          }
        },
        admins: {
          where: {
            userId: session.user.id
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isOwner = group.owner.id === session.user.id;
    const isAdmin = group.admins.length > 0;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to remove members from this group" },
        { status: 403 }
      );
    }

    // Cannot remove the owner
    if (memberId === group.owner.id) {
      return NextResponse.json(
        { error: "Cannot remove the group owner" },
        { status: 400 }
      );
    }

    // Check if the member is an admin and the current user is not the owner
    if (!isOwner) {
      // Get admin status of the member
      const memberAdminCheck = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          admins: {
            where: {
              userId: memberId
            },
            select: {
              id: true
            }
          }
        }
      });
      
      const memberIsAdmin = memberAdminCheck?.admins.length > 0;

      if (memberIsAdmin) {
        return NextResponse.json(
          { error: "Only the group owner can remove admins" },
          { status: 403 }
        );
      }
    }

    // Remove the member from the group's members relation
    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: memberId }
        }
      }
    });

    // If the member was an admin, remove them from the admin role too
    // We'll use a raw query or a different approach since we're having issues with the model
    await prisma.$executeRaw`DELETE FROM "GroupAdmin" WHERE "groupId" = ${groupId} AND "userId" = ${memberId}`;

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
} 