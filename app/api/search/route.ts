import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Search API endpoint that handles searching across users, groups, events, and locations
 * with support for filtering, respecting privacy settings, and proper pagination.
 * 
 * This optimized version:
 * 1. Uses proper pagination to reduce memory usage
 * 2. Limits the amount of data returned in each response
 * 3. Uses more efficient database queries
 * 4. Implements caching headers
 * 5. Applies proper error handling
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate search parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const sports = searchParams.get("sports")?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 50); // Cap at 50 items
    const skip = (page - 1) * limit;
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
    const counts: Record<string, number> = {};
    
    // Search users (only if authenticated)
    if ((type === "users" || type === "all") && userId) {
      try {
        // Build where clause for user search
        const userWhereClause = {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
          id: { not: userId }, // Exclude the current user
          ...(sports.length > 0 && {
            sports: { hasSome: sports }
          })
        };
        
        // Get count first for pagination info
        const totalUserCount = await prisma.user.count({
          where: userWhereClause
        });
        
        counts.users = totalUserCount;
        
        // Skip the query if there are no results or we're past the available pages
        if (totalUserCount === 0 || skip >= totalUserCount) {
          results.users = [];
        } else {
          // Execute query with pagination
          const users = await prisma.user.findMany({
            where: userWhereClause,
            select: {
              id: true,
              name: true,
              image: true,
              location: true,
              sports: true,
            },
            orderBy: { name: 'asc' },
            skip,
            take: limit,
          });
    
          results.users = users;
        }
      } catch (error) {
        console.error("Error searching users:", error);
        results.users = [];
        counts.users = 0;
      }
    }
    
    // Search groups
    if (type === "groups" || type === "all") {
      try {
        // Base group search query - optimize for search performance
        const baseWhereClause = {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { sport: { contains: query, mode: "insensitive" } },
          ],
          ...(sports.length > 0 && {
            sport: { in: sports }
          }),
          ...(isPrivate && { isPrivate: isPrivate === 'true' })
        };
        
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
        
        // Get count first for pagination info
        const totalGroupCount = await prisma.group.count({
          where: whereClause
        });
        
        counts.groups = totalGroupCount;
        
        // Skip the query if there are no results or we're past the available pages
        if (totalGroupCount === 0 || skip >= totalGroupCount) {
          results.groups = [];
        } else {
          const groups = await prisma.group.findMany({
            where: whereClause,
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              sport: true,
              isPrivate: true,
              createdAt: true,
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
              { 
                _count: { members: 'desc' } 
              },
              { createdAt: 'desc' }
            ],
            skip,
            take: limit,
          });
          
          results.groups = groups;
        }
      } catch (error) {
        console.error("Error searching groups:", error);
        results.groups = [];
        counts.groups = 0;
      }
    }
    
    // Search events
    if (type === "events" || type === "all") {
      try {
        // Base where clause for events
        const baseWhereClause = {
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
        
        // Get count first for pagination info
        const totalEventCount = await prisma.event.count({
          where: whereClause
        });
        
        counts.events = totalEventCount;
        
        // Skip the query if there are no results or we're past the available pages
        if (totalEventCount === 0 || skip >= totalEventCount) {
          results.events = [];
        } else {
          const events = await prisma.event.findMany({
            where: whereClause,
            select: {
              id: true,
              title: true,
              description: true,
              startTime: true,
              endTime: true,
              isRecurring: true,
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
            skip,
            take: limit,
          });
          
          results.events = events;
        }
      } catch (error) {
        console.error("Error searching events:", error);
        results.events = [];
        counts.events = 0;
      }
    }
    
    // Search locations
    if (type === "locations" || type === "all") {
      try {
        // Base where clause for locations
        const whereClause = {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { state: { contains: query, mode: "insensitive" } },
            { country: { contains: query, mode: "insensitive" } },
          ],
        };
        
        // Get count first for pagination info
        const totalLocationCount = await prisma.location.count({
          where: whereClause
        });
        
        counts.locations = totalLocationCount;
        
        // Skip the query if there are no results or we're past the available pages
        if (totalLocationCount === 0 || skip >= totalLocationCount) {
          results.locations = [];
        } else {
          const locations = await prisma.location.findMany({
            where: whereClause,
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              city: true,
              state: true,
              country: true,
              amenities: true,
              sportTypes: true,
              _count: {
                select: {
                  events: true,
                  reviews: true,
                },
              },
            },
            orderBy: [
              { _count: { events: 'desc' } },
              { name: 'asc' }
            ],
            skip,
            take: limit,
          });
          
          results.locations = locations;
        }
      } catch (error) {
        console.error("Error searching locations:", error);
        results.locations = [];
        counts.locations = 0;
      }
    }
    
    // Create pagination metadata
    const pagination = {
      page,
      limit,
      counts,
      hasMore: Object.entries(counts).some(([key, count]) => skip + limit < count),
      totalPages: Object.entries(counts).reduce((acc, [key, count]) => {
        acc[key] = Math.ceil(count / limit);
        return acc;
      }, {} as Record<string, number>)
    };

    // Format response with pagination info
    const response = NextResponse.json({
      results,
      pagination
    });
    
    // Add cache headers (cache for 5 minutes)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    
    return response;
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 