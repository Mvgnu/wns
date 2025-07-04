import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST route to like a feed post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to like a post
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const postId = params.postId;
    
    // Check if the post exists
    const post = await prisma.feedPost.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has already liked the post
    const existingLike = await prisma.feedPostLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });
    
    if (existingLike) {
      return NextResponse.json(
        { error: "You have already liked this post" },
        { status: 400 }
      );
    }
    
    // Create the like
    await prisma.feedPostLike.create({
      data: {
        userId,
        postId
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Post liked successfully"
    });
    
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json(
      { error: "Failed to like post" },
      { status: 500 }
    );
  }
}

// DELETE route to unlike a feed post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to unlike a post
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const postId = params.postId;
    
    // Check if the like exists
    const existingLike = await prisma.feedPostLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });
    
    if (!existingLike) {
      return NextResponse.json(
        { error: "You have not liked this post" },
        { status: 400 }
      );
    }
    
    // Delete the like
    await prisma.feedPostLike.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Post unliked successfully"
    });
    
  } catch (error) {
    console.error("Error unliking post:", error);
    return NextResponse.json(
      { error: "Failed to unlike post" },
      { status: 500 }
    );
  }
} 