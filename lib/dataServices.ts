'use server';
// ^ Ensure server-side execution

import { prisma } from './prisma';
import { getSportsByCategory } from './sportsData';

/**
 * Data fetching service for the homepage
 * This centralizes all database queries for better organization and testability
 */
export async function getHomePageData() {
  try {
    // Get all sports organized by category
    const sportsByCategory = getSportsByCategory();
    
    // Fetch important stats
    const groupsCount = await prisma.group.count();
    const locationsCount = await prisma.location.count();
    const usersCount = await prisma.user.count();
    
    // Get most popular groups for each sport category
    const categoryHighlights: Record<string, any> = {};
    
    // Get popular groups and events for each category
    for (const category of Object.keys(sportsByCategory)) {
      // Instead of getting highlights for all sports in a category,
      // we'll get highlights for the category as a whole
      
      // Get most popular group for this category (most members)
      const topGroup = await prisma.group.findFirst({
        where: {
          // Use the first sport in the category as a representative
          // This avoids showing the same group for multiple sports
          sport: sportsByCategory[category][0].value
        },
        orderBy: {
          members: {
            _count: 'desc'
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          sport: true,
          location: true,
          isPrivate: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          _count: {
            select: { members: true }
          }
        },
        take: 1
      });
      
      // Get upcoming event for this category
      const upcomingEvent = await prisma.event.findFirst({
        where: {
          group: {
            // Use the first sport in the category as a representative
            sport: sportsByCategory[category][0].value
          },
          startTime: {
            gte: new Date()
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          image: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          group: {
            select: {
              id: true,
              name: true,
              image: true,
              sport: true
            }
          }
        },
        take: 1
      });
      
      categoryHighlights[category] = {
        topGroup,
        upcomingEvent
      };
    }
    
    return {
      sportsByCategory,
      groupsCount,
      locationsCount,
      usersCount,
      categoryHighlights
    };
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    // Return a default structure with empty values to prevent errors in UI
    return {
      sportsByCategory: getSportsByCategory(),
      groupsCount: 0,
      locationsCount: 0,
      usersCount: 0,
      categoryHighlights: {}
    };
  }
} 