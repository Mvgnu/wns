import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET handler for individual post by ID or slug
export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const { params } = context;
    const postParam = params?.id;

    if (!postParam) {
      return NextResponse.json(
        { error: "Post ID or slug is required" },
        { status: 400 }
      );
    }

    // First try to find by slug, then by ID for backward compatibility
    let post = await prisma.post.findUnique({
      where: { slug: postParam },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
          },
        },
        comments: {
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
          where: { parentId: null }, // Only get top-level comments
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // If not found by slug, try by ID
    if (!post) {
      post = await prisma.post.findUnique({
        where: { id: postParam },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
          comments: {
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
            where: { parentId: null }, // Only get top-level comments
            orderBy: { createdAt: 'desc' },
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });
    }

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

