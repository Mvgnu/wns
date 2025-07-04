import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Reply schema for validation
const replySchema = z.object({
  content: z.string().min(1, "Reply content is required").max(500, "Reply cannot exceed 500 characters")
});

// GET route to fetch all replies for a post
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to view replies
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const postId = params.postId;
    
    // Check if the post exists
    const post = await prisma.$transaction(async (tx) => {
      return tx.feedPost.findUnique({
        where: { id: postId }
      });
    });
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // Parse query parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get the replies with author information
    const replies = await prisma.$transaction(async (tx) => {
      return tx.feedPostReply.findMany({
        where: { postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      });
    });
    
    // Get the total count for pagination
    const totalCount = await prisma.$transaction(async (tx) => {
      return tx.feedPostReply.count({
        where: { postId }
      });
    });
    
    return NextResponse.json({
      replies,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip + limit < totalCount
      }
    });
    
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

// POST route to add a reply to a feed post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to reply to a post
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const postId = params.postId;
    
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = replySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { content } = validationResult.data;
    
    // Check if the post exists
    const post = await prisma.$transaction(async (tx) => {
      return tx.feedPost.findUnique({
        where: { id: postId }
      });
    });
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // Create the reply
    const reply = await prisma.$transaction(async (tx) => {
      return tx.feedPostReply.create({
        data: {
          content,
          authorId: userId,
          postId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      reply
    });
    
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json(
      { error: "Failed to add reply" },
      { status: 500 }
    );
  }
}

// DELETE route to remove a reply
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to delete a reply
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Extract the replyId from the query parameters
    const url = new URL(req.url);
    const replyId = url.searchParams.get("replyId");
    
    if (!replyId) {
      return NextResponse.json(
        { error: "Reply ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the reply exists and belongs to the user
    const reply = await prisma.$transaction(async (tx) => {
      return tx.feedPostReply.findUnique({
        where: { id: replyId }
      });
    });
    
    if (!reply) {
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      );
    }
    
    // Only the author of the reply can delete it
    if (reply.authorId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to delete this reply" },
        { status: 403 }
      );
    }
    
    // Delete the reply
    await prisma.$transaction(async (tx) => {
      return tx.feedPostReply.delete({
        where: { id: replyId }
      });
    });
    
    return NextResponse.json({
      success: true,
      message: "Reply deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
} 