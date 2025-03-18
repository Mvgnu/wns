import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for role change
const roleSchema = z.object({
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'member'" }),
  }),
});

// PATCH handler for changing a member's role
export async function PATCH(
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

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = roleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    // Fetch the group to check ownership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true
          }
        },
        members: {
          where: {
            id: memberId
          },
          select: {
            id: true
          }
        },
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

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Only group owner can change roles
    if (group.owner.id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group owner can change member roles" },
        { status: 403 }
      );
    }

    // Prevent changing role of the owner
    if (memberId === group.owner.id) {
      return NextResponse.json(
        { error: "Cannot change the role of the group owner" },
        { status: 400 }
      );
    }

    // Check if the member exists in the group
    if (group.members.length === 0) {
      return NextResponse.json(
        { error: "Member not found in the group" },
        { status: 404 }
      );
    }

    // Update the member's role based on the requested role
    if (role === "admin") {
      // Check if already an admin
      const isAlreadyAdmin = group.admins.length > 0;

      if (!isAlreadyAdmin) {
        // Add as admin using raw query
        await prisma.$executeRaw`INSERT INTO "GroupAdmin" ("id", "createdAt", "groupId", "userId") 
          VALUES (gen_random_uuid(), NOW(), ${groupId}, ${memberId})
          ON CONFLICT ("groupId", "userId") DO NOTHING`;
      }
    } else {
      // Remove from admin if they were an admin
      await prisma.$executeRaw`DELETE FROM "GroupAdmin" WHERE "groupId" = ${groupId} AND "userId" = ${memberId}`;
    }

    return NextResponse.json({
      success: true,
      message: `Member role updated to ${role}`,
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
} 