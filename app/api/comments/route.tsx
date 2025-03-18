import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Schema for comment creation
const commentCreateSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, "Comment content cannot be empty"),
  parentId: z.string().optional(),
});

// Schema for comment update
const commentUpdateSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
});

// GET handler for retrieving comments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const parentId = searchParams.get("parentId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Build query based on filters
    const whereClause: any = { postId };
    if (parentId === null || parentId === "null") {
      // Get top-level comments (no parent)
      whereClause.parentId = null;
    } else if (parentId) {
      // Get replies to a specific comment
      whereClause.parentId = parentId;
    }

    // Get total count for pagination
    const totalComments = await prisma.comment.count({ where: whereClause });
    
    // Get comments with author information and counts of replies
    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Oldest first for comments
      },
      take: limit,
      skip,
    });

    return NextResponse.json({
      comments,
      pagination: {
        total: totalComments,
        pages: Math.ceil(totalComments / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST handler for creating new comments
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
    const validatedData = commentCreateSchema.parse(body);

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: validatedData.postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // If there's a parentId, check if the parent comment exists and is part of the same post
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment.postId !== validatedData.postId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to the same post" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        postId: validatedData.postId,
        parentId: validatedData.parentId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Create a notification for the post author if it's not the same person commenting
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "comment",
          message: `${session.user.name || "Someone"} commented on your post`,
          userId: post.authorId,
          relatedId: validatedData.postId,
        },
      });
    }

    // If this is a reply, create a notification for the parent comment author
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { authorId: true },
      });

      if (parentComment && parentComment.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: "reply",
            message: `${session.user.name || "Someone"} replied to your comment`,
            userId: parentComment.authorId,
            relatedId: validatedData.parentId,
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// PUT handler for updating comments
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    const validatedData = commentUpdateSchema.parse(updateData);

    // Check if the comment exists and belongs to the user
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (existingComment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: validatedData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing comments
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

    if (!id) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Check if the comment exists and belongs to the user
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (existingComment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment and all replies
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { parentId: id } }),
      prisma.comment.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 