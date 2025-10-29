'use server';
// ^ Ensure server-side execution

import prisma from './prisma';
import { getSportsByCategory } from './sportsData';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { getPersonalizedHomeContent } from '@/lib/recommendations/engine';
import { isFeatureEnabled } from './featureFlags';
import { withCircuitBreaker } from './circuitBreaker';

/**
 * Data fetching service for the homepage
 * This centralizes all database queries for better organization and testability
 */
export async function getHomePageData() {
  try {
    // Get current user session for conditional privacy filtering
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Get all sports organized by category
    const sportsByCategory = getSportsByCategory();
    
    // Fetch important stats - only count public entities for non-logged in users
    const statsFallback: [number, number, number] = [0, 0, 0];
    const [groupsCount, locationsCount, usersCount] = await withCircuitBreaker(
      'homepage.stats',
      async () =>
        await Promise.all([
          // For groups, only count public ones for non-logged in users
          prisma.group.count({
            where: userId ? undefined : { isPrivate: false }
          }),
          // For locations, all are public
          prisma.location.count(),
          // For users, all user counts are public
          prisma.user.count()
        ]),
      async () => statsFallback
    );

    const personalizationEnabled = isFeatureEnabled('personalizedHome');
    const personalizedContentPromise = personalizationEnabled
      ? getPersonalizedHomeContent(userId ?? undefined)
      : getPersonalizedHomeContent(undefined);
    
    // Get most popular groups for each sport category
    const categoryHighlights: Record<string, any> = {};
    
    // Prepare all category highlights in parallel
    await Promise.all(
      Object.keys(sportsByCategory).map(async (category) => {
        // Get highlights for each sport in the category in parallel
        const sportHighlights = await Promise.all(
          sportsByCategory[category].map(async (sport) => {
            try {
              // Build appropriate privacy filter based on user login status
              let groupWhereInput: Prisma.GroupWhereInput;
              
              if (userId) {
                // If user is logged in, they can see:
                // 1. Public groups for this sport
                // 2. Private groups they are a member of
                // 3. Private groups they own
                groupWhereInput = {
                  sport: sport.value,
                  OR: [
                    { isPrivate: false },
                    {
                      isPrivate: true,
                      members: { some: { id: userId } }
                    },
                    {
                      isPrivate: true,
                      ownerId: userId
                    }
                  ]
                };
              } else {
                // For non-logged in users, only show public groups
                groupWhereInput = {
                  sport: sport.value,
                  isPrivate: false
                };
              }
              
              // Get most popular group for this specific sport
              const topGroup = await withCircuitBreaker(
                `homepage.topGroup.${sport.value}`,
                async () =>
                  prisma.group.findFirst({
                    where: groupWhereInput,
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
                  }),
                async () => null
              );
              
              // Get upcoming event for this specific sport
              const upcomingEvent = await withCircuitBreaker(
                `homepage.upcomingEvent.${sport.value}`,
                async () =>
                  prisma.event.findFirst({
                    where: {
                      group: groupWhereInput,
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
                          sport: true,
                          isPrivate: true
                        }
                      }
                    },
                    take: 1
                  }),
                async () => null
              );
              
              return {
                sport: sport.value,
                label: sport.label,
                description: sport.description,
                topGroup,
                upcomingEvent
              };
            } catch (error) {
              console.error(`Error fetching highlights for sport ${sport.value}:`, error);
              // Return empty highlight on error to ensure we don't break the entire page
              return {
                sport: sport.value,
                label: sport.label,
                description: sport.description,
                topGroup: null,
                upcomingEvent: null
              };
            }
          })
        );
        
        // Filter out sports with no highlights to optimize the payload
        categoryHighlights[category] = sportHighlights.filter(
          highlight => highlight.topGroup !== null || highlight.upcomingEvent !== null
        );
      })
    );
    
    // Create hardcoded sport image paths
    const sportImages: Record<string, string> = {};
    Object.values(sportsByCategory).flat().forEach(sport => {
      sportImages[sport.value] = `/images/sports/sport-${sport.value}.jpg`;
    });
    
    const personalizedContent = await personalizedContentPromise;

    return {
      sportsByCategory,
      groupsCount,
      locationsCount,
      usersCount,
      categoryHighlights,
      sportImages,
      personalizedContent
    };
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    // Return a default structure with empty values to prevent errors in UI
    return {
      sportsByCategory: getSportsByCategory(),
      groupsCount: 0,
      locationsCount: 0,
      usersCount: 0,
      categoryHighlights: {},
      sportImages: {},
      personalizedContent: await getPersonalizedHomeContent(undefined)
    };
  }
}