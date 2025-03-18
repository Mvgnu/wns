export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSafeServerSession } from "@/lib/sessionHelper";
import { prisma } from "@/lib/prisma";

// Schema for profile update
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  sports: z.array(z.string()).optional(),
  image: z.string().url().optional(),
});

// GET handler for retrieving user profiles
export async function GET(req: NextRequest) {
  try {
    // Use safe session helper to handle JWT errors gracefully
    const session = await getSafeServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to view your profile" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user profile with post and group counts
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        sports: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            ownedGroups: true,
            memberGroups: true,
            events: true,
            attendingEvents: true,
            locations: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the current user follows this profile
    let isFollowing = false;
    if (session?.user) {
      // Here you would check if the current user follows the requested profile
      // This would require adding a follows table to your schema
      // For now, we'll just return false
      isFollowing = false;
    }

    return NextResponse.json({
      ...profile,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT handler for updating user profile
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
    const validatedData = profileUpdateSchema.parse(body);

    // Update the user profile
    const updatedProfile = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        sports: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            ownedGroups: true,
            memberGroups: true,
            events: true,
            attendingEvents: true,
            locations: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// PATCH handler for follow/unfollow operations
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
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot follow/unfollow yourself" },
        { status: 400 }
      );
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Note: This implementation is a placeholder since we don't have a follows table
    // You would need to add this table to your schema to implement this functionality
    
    switch (action) {
      case "follow":
        // Implement follow logic here when schema is updated
        return NextResponse.json({ 
          success: true, 
          message: "Follow functionality would be implemented here",
          isFollowing: true 
        });

      case "unfollow":
        // Implement unfollow logic here when schema is updated
        return NextResponse.json({ 
          success: true,
          message: "Unfollow functionality would be implemented here",
          isFollowing: false
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error performing follow/unfollow operation:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
} 