import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET handler to fetch a group by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const groupId = params.id;

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Find the group with all fields
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

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
            id: groupId,
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
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            image: true,
          },
          take: 10, // Limit number of members returned
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