import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allSports } from "@/lib/sportsData";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, groups, events, locations, users
    const sports = searchParams.get("sports")?.split(',') || [];
    const limit = parseInt(searchParams.get("limit") || "15");
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Get user for access control
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const results: any = {};
    
    // Search users (only if authenticated)
    if ((type === "users" || type === "all") && userId) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            // Search by sports
            ...(sports.length > 0 ? [{ sports: { hasSome: sports } }] : []),
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
          // Email is private
        },
        take: limit,
      });

      results.users = users;
    }
    
    // Search groups
    if (type === "groups" || type === "all") {
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
      
      // Add privacy filter based on user
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
          { _count: { members: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit,
      });
      
      results.groups = groups;
    }
    
    // Search events
    if (type === "events" || type === "all") {
      // Base where clause for events
      const baseWhereClause: any = {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        // Only show future events by default
        startTime: { gte: new Date() },
      };
      
      // Add sports filter through group relation
      if (sports.length > 0) {
        baseWhereClause.OR.push({ 
          group: { 
            sport: { in: sports } 
          } 
        });
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
    }
    
    // Search locations
    if (type === "locations" || type === "all") {
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
              reviews: true,
            },
          },
        },
        orderBy: [
          // Order by rating (if exists)
          { rating: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' }
        ],
        take: limit,
      });
      
      results.locations = locations;
    }
    
    // Log search query for analytics
    console.log(`Search: "${query}" (type: ${type}, sports: ${sports.join(',')})`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 