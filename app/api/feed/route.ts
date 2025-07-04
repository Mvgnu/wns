import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Feed post schema for validation
const feedPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(1, "Content is required").max(1000, "Content cannot exceed 1000 characters"),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  targets: z.array(
    z.object({
      targetType: z.enum(["user", "group", "location", "event"]),
      targetId: z.string().min(1)
    })
  ).min(1, "At least one target is required")
});

// GET route to fetch all feed posts the user has access to
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to access the feed
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const filter = url.searchParams.get("filter") || "all"; // all, groups, locations, users
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the query based on user membership and permissions
    let whereClause: any = {};
    
    // Only return posts from targets the user has permission to view
    if (filter === "all") {
      whereClause = {
        OR: [
          // Posts in groups the user is a member of
          {
            targets: {
              some: {
                targetType: "group",
                AND: [
                  {
                    targetId: {
                      in: await prisma.group.findMany({
                        where: {
                          OR: [
                            { ownerId: userId },
                            { admins: { some: { userId } } },
                            { members: { some: { id: userId } } }
                          ]
                        },
                        select: { id: true }
                      }).then(groups => groups.map(g => g.id))
                    }
                  }
                ]
              }
            }
          },
          // Posts in public locations
          {
            targets: {
              some: {
                targetType: "location",
                AND: [
                  {
                    targetId: {
                      in: await prisma.location.findMany({
                        where: {
                          isPublic: true
                        },
                        select: { id: true }
                      }).then(locations => locations.map(l => l.id))
                    }
                  }
                ]
              }
            }
          },
          // Posts in events the user is attending
          {
            targets: {
              some: {
                targetType: "event",
                AND: [
                  {
                    targetId: {
                      in: await prisma.event.findMany({
                        where: {
                          OR: [
                            { organizerId: userId },
                            { coOrganizers: { some: { userId } } },
                            { attendees: { some: { id: userId } } }
                          ]
                        },
                        select: { id: true }
                      }).then(events => events.map(e => e.id))
                    }
                  }
                ]
              }
            }
          },
          // User's own posts and posts directed at the user
          {
            OR: [
              { authorId: userId },
              {
                targets: {
                  some: {
                    targetType: "user",
                    targetId: userId
                  }
                }
              }
            ]
          }
        ]
      };
    } else if (filter === "groups") {
      // Only include posts from groups
      whereClause = {
        targets: {
          some: {
            targetType: "group",
            targetId: {
              in: await prisma.group.findMany({
                where: {
                  OR: [
                    { ownerId: userId },
                    { admins: { some: { userId } } },
                    { members: { some: { id: userId } } }
                  ]
                },
                select: { id: true }
              }).then(groups => groups.map(g => g.id))
            }
          }
        }
      };
    } else if (filter === "locations") {
      // Only include posts from locations
      whereClause = {
        targets: {
          some: {
            targetType: "location"
          }
        }
      };
    } else if (filter === "users") {
      // Only include posts from users (specifically directed at the current user)
      whereClause = {
        OR: [
          { authorId: userId },
          {
            targets: {
              some: {
                targetType: "user",
                targetId: userId
              }
            }
          }
        ]
      };
    }
    
    // Query the posts with appropriate includes
    const posts = await prisma.$transaction(async (prismaClient) => {
      return prismaClient.feedPost.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          targets: {
            include: {
              post: true
            }
          },
          replies: {
            take: 3, // Only get the most recent 3 replies
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              replies: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      });
    });
    
    // Get the total count for pagination
    const totalCount = await prisma.$transaction(async (prismaClient) => {
      return prismaClient.feedPost.count({
        where: whereClause
      });
    });
    
    // For each post, determine if the current user has liked it
    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      const hasLiked = await prisma.$transaction(async (prismaClient) => {
        return prismaClient.feedPostLike.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: post.id
            }
          }
        });
      });
      
      // Resolve target names (for display purposes)
      const enrichedTargets = await Promise.all(post.targets.map(async (target: any) => {
        let targetName = "";
        let targetImage = "";
        
        if (target.targetType === "group") {
          const group = await prisma.group.findUnique({
            where: { id: target.targetId },
            select: { name: true, image: true }
          });
          targetName = group?.name || "Unknown Group";
          targetImage = group?.image || "";
        } else if (target.targetType === "location") {
          const location = await prisma.location.findUnique({
            where: { id: target.targetId },
            select: { name: true, images: true }
          });
          targetName = location?.name || "Unknown Location";
          targetImage = location?.images?.[0] || "";
        } else if (target.targetType === "event") {
          const event = await prisma.event.findUnique({
            where: { id: target.targetId },
            select: { title: true, image: true }
          });
          targetName = event?.title || "Unknown Event";
          targetImage = event?.image || "";
        } else if (target.targetType === "user") {
          const user = await prisma.user.findUnique({
            where: { id: target.targetId },
            select: { name: true, image: true }
          });
          targetName = user?.name || "Unknown User";
          targetImage = user?.image || "";
        }
        
        return {
          ...target,
          targetName,
          targetImage
        };
      }));
      
      return {
        ...post,
        targets: enrichedTargets,
        hasLiked: !!hasLiked
      };
    }));
    
    return NextResponse.json({
      posts: postsWithLikeStatus,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip + limit < totalCount
      }
    });
    
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

// POST route to create a new feed post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // User must be logged in to create a post
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = feedPostSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { title, content, imageUrl, videoUrl, targets } = validationResult.data;
    
    // Check if the user has permission to post to each target
    for (const target of targets) {
      const { targetType, targetId } = target;
      
      if (targetType === "group") {
        // Check if user is a member of the group
        const group = await prisma.group.findFirst({
          where: {
            id: targetId,
            OR: [
              { ownerId: userId },
              { admins: { some: { userId } } },
              { members: { some: { id: userId } } }
            ]
          }
        });
        
        if (!group) {
          return NextResponse.json(
            { error: `You do not have permission to post to the group with ID ${targetId}` },
            { status: 403 }
          );
        }
      } else if (targetType === "location") {
        // For public locations, all users can post
        // For private locations, check if user is a manager or staff
        const location = await prisma.location.findUnique({
          where: { id: targetId }
        });
        
        if (!location) {
          return NextResponse.json(
            { error: `Location with ID ${targetId} not found` },
            { status: 404 }
          );
        }
        
        if (!location.isPublic) {
          // Check if user is a manager or staff of the location
          const staff = await prisma.placeStaff.findFirst({
            where: {
              locationId: targetId,
              userId
            }
          });
          
          if (!staff) {
            return NextResponse.json(
              { error: `You do not have permission to post to the private location with ID ${targetId}` },
              { status: 403 }
            );
          }
        }
      } else if (targetType === "event") {
        // Check if user is an organizer or attending the event
        const event = await prisma.event.findFirst({
          where: {
            id: targetId,
            OR: [
              { organizerId: userId },
              { coOrganizers: { some: { userId } } },
              { attendees: { some: { id: userId } } }
            ]
          }
        });
        
        if (!event) {
          return NextResponse.json(
            { error: `You do not have permission to post to the event with ID ${targetId}` },
            { status: 403 }
          );
        }
      } else if (targetType === "user") {
        // Users can post to their own feed or to another user's feed if they have permission
        // For simplicity, let's just allow posting to self for now
        if (targetId !== userId) {
          return NextResponse.json(
            { error: "You can only post to your own user feed" },
            { status: 403 }
          );
        }
      }
    }
    
    // Create the feed post
    const post = await prisma.$transaction(async (prismaClient) => {
      return prismaClient.feedPost.create({
        data: {
          title,
          content,
          imageUrl,
          videoUrl,
          authorId: userId,
          targets: {
            create: targets.map(({ targetType, targetId }) => ({
              targetType,
              targetId
            }))
          }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          targets: true
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      post
    });
    
  } catch (error) {
    console.error("Error creating feed post:", error);
    return NextResponse.json(
      { error: "Failed to create feed post" },
      { status: 500 }
    );
  }
} 