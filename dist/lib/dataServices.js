"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomePageData = getHomePageData;
// ^ Ensure server-side execution
const prisma_1 = require("./prisma");
const sportsData_1 = require("./sportsData");
/**
 * Data fetching service for the homepage
 * This centralizes all database queries for better organization and testability
 */
async function getHomePageData() {
    try {
        // Get all sports organized by category
        const sportsByCategory = (0, sportsData_1.getSportsByCategory)();
        // Fetch important stats
        const groupsCount = await prisma_1.prisma.group.count();
        const locationsCount = await prisma_1.prisma.location.count();
        const usersCount = await prisma_1.prisma.user.count();
        // Get most popular groups for each sport category
        const categoryHighlights = {};
        // Get popular groups and events for each category
        for (const category of Object.keys(sportsByCategory)) {
            // Instead of getting highlights for all sports in a category,
            // we'll get highlights for the category as a whole
            // Get most popular group for this category (most members)
            const topGroup = await prisma_1.prisma.group.findFirst({
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
            const upcomingEvent = await prisma_1.prisma.event.findFirst({
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
    }
    catch (error) {
        console.error('Error in getHomePageData:', error);
        // Return a default structure with empty values to prevent errors in UI
        return {
            sportsByCategory: (0, sportsData_1.getSportsByCategory)(),
            groupsCount: 0,
            locationsCount: 0,
            usersCount: 0,
            categoryHighlights: {}
        };
    }
}
