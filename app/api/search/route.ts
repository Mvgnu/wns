import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allSports } from "@/lib/sportsData";
import { Prisma } from "@prisma/client";

/**
 * Search API endpoint that handles searching across users, groups, events, and locations
 * with support for filtering and respecting privacy settings.
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate search parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const sports = searchParams.get("sports")?.split(',') || [];
    const limit = parseInt(searchParams.get("limit") || "15");
    const date = searchParams.get("date");
    const location = searchParams.get("location");
    const isRecurring = searchParams.get("isRecurring");
    const isPrivate = searchParams.get("isPrivate");
    
    // Ensure query parameter is provided
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Get user for access control
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const results: Record<string, any> = {};
    
    // Search users (only if authenticated)
    if ((type === "users" || type === "all") && userId) {
      try {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
            id: { not: userId }, // Exclude the current user
            ...(sports.length > 0 && {
              OR: [
                { sports: { hasSome: sports } }
              ]
            })
          },
          select: {
            id: true,
            name: true,
            image: true,
            location: true,
            sports: true,
          },
          take: limit,
        });
  
        results.users = users;
      } catch (error) {
        console.error("Error searching users:", error);
        results.users = [];
      }
    }
    
    // Search groups
    if (type === "groups" || type === "all") {
      try {
        // Base group search query
        const baseWhereClause: any = {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { sport: { contains: query, mode: "insensitive" } },
          ],
        };
        
        // Add sports filter
        if (sports.length > 0) {
          baseWhereClause.OR.push({ sport: { in: sports } });
        }
  
        // Add privacy filter
        if (isPrivate) {
          baseWhereClause.isPrivate = isPrivate === 'true';
        }
        
        // Add privacy access control based on user
        const privacyWhereClause = userId 
          ? {
              OR: [
                { isPrivate: false },
                { 
                  isPrivate: true,
                  OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } }
                  ]
                }
              ]
            }
          : { isPrivate: false };
        
        // Combine base and privacy filters
        const whereClause = {
          AND: [
            baseWhereClause,
            privacyWhereClause
          ]
        };
        
        const groups = await prisma.group.findMany({
          where: whereClause,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                members: true,
                posts: true,
                events: true,
              },
            },
          },
          orderBy: [
            { createdAt: 'desc' }
          ],
          take: limit,
        });
        
        // Sort manually by member count
        results.groups = groups.sort((a, b) => {
          return b._count.members - a._count.members;
        });
      } catch (error) {
        console.error("Error searching groups:", error);
        results.groups = [];
      }
    }
    
    // Search events
    if (type === "events" || type === "all") {
      try {
        // Base where clause for events
        const baseWhereClause: any = {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        };
        
        // Add date filter
        if (date) {
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              baseWhereClause.startTime = {
                gte: new Date(dateObj.setHours(0, 0, 0, 0)),
                lt: new Date(dateObj.setHours(23, 59, 59, 999))
              };
            }
          } catch (error) {
            console.error("Invalid date format:", error);
            // Fallback to future events if date parsing fails
            baseWhereClause.startTime = { gte: new Date() };
          }
        } else {
          // Only show future events by default
          baseWhereClause.startTime = { gte: new Date() };
        }
        
        // Add sports filter through group relation
        if (sports.length > 0) {
          baseWhereClause.OR.push({ 
            group: { 
              sport: { in: sports } 
            } 
          });
        }
  
        // Add location filter
        if (location) {
          baseWhereClause.OR.push({
            location: {
              OR: [
                { name: { contains: location, mode: "insensitive" } },
                { address: { contains: location, mode: "insensitive" } }
              ]
            }
          });
        }
  
        // Add recurring filter
        if (isRecurring) {
          baseWhereClause.isRecurring = isRecurring === 'true';
        }
        
        // Add privacy filter based on user
        const privacyWhereClause = userId 
          ? {
              OR: [
                { group: { isPrivate: false } },
                { group: { 
                    isPrivate: true, 
                    OR: [
                      { ownerId: userId },
                      { members: { some: { id: userId } } }
                    ]
                  } 
                },
                { group: null }, // Events without groups are public
              ]
            }
          : {
              OR: [
                { group: { isPrivate: false } },
                { group: null },
              ]
            };
        
        // Combine base and privacy filters
        const whereClause = {
          AND: [
            baseWhereClause,
            privacyWhereClause
          ]
        };
        
        const events = await prisma.event.findMany({
          where: whereClause,
          include: {
            organizer: {
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
                sport: true,
                image: true,
                isPrivate: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
            _count: {
              select: {
                attendees: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
          take: limit,
        });
        
        results.events = events;
      } catch (error) {
        console.error("Error searching events:", error);
        results.events = [];
      }
    }
    
    // Search locations
    if (type === "locations" || type === "all") {
      try {
        // Base where clause for locations
        const baseWhereClause: any = {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { type: { contains: query, mode: "insensitive" } },
            { sport: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        };
        
        // Add sports filter
        if (sports.length > 0) {
          baseWhereClause.OR.push(
            { sport: { in: sports } },
            { sports: { hasSome: sports } }
          );
        }
  
        // Add type filter
        if (location) {
          baseWhereClause.type = location;
        }
        
        const locations = await prisma.location.findMany({
          where: baseWhereClause,
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                events: true,
              },
            },
          },
          orderBy: [
            { createdAt: 'desc' }
          ],
          take: limit,
        });
        
        // Sort manually by event count
        results.locations = locations.sort((a, b) => {
          return b._count.events - a._count.events;
        });
      } catch (error) {
        console.error("Error searching locations:", error);
        results.locations = [];
      }
    }

    // Return results with cache control headers
    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "An error occurred while searching" },
      { status: 500 }
    );
  }
} 