'use server';
// ^ Ensure server-side execution

import { prisma } from './prisma';
import { getSportsByCategory } from './sportsData';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Get the image path for a specific sport
 * @param sport - The sport value to get the image for
 * @returns The path to the sport image or a default image if not found
 */
export async function getSportImagePath(sport: string): Promise<string> {
  try {
    if (!sport) return '/images/default-sport.jpg';
    
    // Normalize the sport name and create the filename with the 'sport-' prefix
    const normalizedSport = sport.replace(/\s+/g, '_');
    const imagePath = `/images/sports/sport-${normalizedSport}.jpg`;
    
    // Try alternate version with hyphens if needed
    const alternateImagePath = `/images/sports/sport-${normalizedSport.replace(/_/g, '-')}.jpg`;
    
    // Check if the file exists in public directory
    const publicDir = path.join(process.cwd(), 'public');
    const imageFilePath = path.join(publicDir, imagePath.substring(1));
    const alternateImageFilePath = path.join(publicDir, alternateImagePath.substring(1));
    
    // Use Promise-based file existence check instead of synchronous fs.existsSync
    try {
      await fs.promises.access(imageFilePath);
      return imagePath;
    } catch {
      try {
        await fs.promises.access(alternateImageFilePath);
        return alternateImagePath;
      } catch {
        // Log message for debugging
        console.log(`Sport image not found for ${sport}, using default. Tried:`, imagePath, alternateImagePath);
        return '/images/default-sport.jpg';
      }
    }
  } catch (error) {
    console.error('Error finding sport image:', error);
    return '/images/default-sport.jpg';
  }
}

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
    const statsPromises = [
      // For groups, only count public ones for non-logged in users
      prisma.group.count({
        where: userId ? undefined : { isPrivate: false }
      }),
      
      // For locations, all are public
      prisma.location.count(),
      
      // For users, all user counts are public
      prisma.user.count()
    ];
    
    const [groupsCount, locationsCount, usersCount] = await Promise.all(statsPromises);
    
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
              const topGroup = await prisma.group.findFirst({
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
              });
              
              // Get upcoming event for this specific sport
              const upcomingEvent = await prisma.event.findFirst({
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
              });
              
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
    
    // Get all sport image paths from the local filesystem
    const sportImages: Record<string, string> = {};
    await Promise.all(
      Object.values(sportsByCategory).flat().map(async (sport) => {
        sportImages[sport.value] = await getSportImagePath(sport.value);
      })
    );
    
    return {
      sportsByCategory,
      groupsCount,
      locationsCount,
      usersCount,
      categoryHighlights,
      sportImages
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
      sportImages: {}
    };
  }
} 