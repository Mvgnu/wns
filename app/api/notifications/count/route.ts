import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET handler for counting unread notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Return zero if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }
    
    // Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false
      }
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting notifications:", error);
    return NextResponse.json(
      { error: "Failed to count notifications", count: 0 },
      { status: 500 }
    );
  }
} 