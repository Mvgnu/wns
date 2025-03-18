export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET handler for fetching the current user's groups
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch groups where the user is a member or owner
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        sport: true,
        isPrivate: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch user groups" },
      { status: 500 }
    );
  }
} 