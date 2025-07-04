import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";

// Create a new notification and send it via WebSocket if needed
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
    const { userId, type, message, relatedId } = body;

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedId,
        read: false,
      },
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(userId, notification);

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Get notifications for the current user
export async function GET() {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // Return empty notifications if not authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ 
        notifications: [],
        unreadCount: 0
      });
    }
    
    // Try to fetch notifications from the database
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
      });
      
      // Count unread notifications
      const unreadCount = await prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false
        }
      });
      
      return NextResponse.json({ 
        notifications, 
        unreadCount
      });
    } catch (dbError) {
      console.error("Database error fetching notifications:", dbError);
      
      // Return empty array as fallback (better UX than error)
      return NextResponse.json({ 
        notifications: [],
        unreadCount: 0
      });
    }
  } catch (error) {
    console.error("Error in notifications API:", error);
    
    // Return a helpful error response
    return NextResponse.json(
      { error: "Failed to load notifications. Please try again later." },
      { status: 500 }
    );
  }
}

// PATCH handler for marking notifications as read
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
    const { id, all } = body;

    if (all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (id) {
      // Mark a specific notification as read
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You can only mark your own notifications as read" },
          { status: 403 }
        );
      }

      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    } else {
      return NextResponse.json(
        { error: "Either notification ID or 'all' flag is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    if (all) {
      // Delete all notifications for the user
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications deleted",
      });
    } else if (id) {
      // Delete a specific notification
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You can only delete your own notifications" },
          { status: 403 }
        );
      }

      await prisma.notification.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Notification deleted",
      });
    } else {
      return NextResponse.json(
        { error: "Either notification ID or 'all' flag is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
} 