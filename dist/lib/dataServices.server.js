"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomePageData = getHomePageData;
// Ensure this code is executed ONLY on the server
const prisma_1 = __importDefault(require("./prisma"));
const sportsData_1 = require("./sportsData");
/**
 * Server-side data fetching for the homepage
 * This centralizes all database queries in a safely isolated server context
 * Must be called from a Server Component or server action
 */
async function getHomePageData() {
    try {
        // Get all sports organized by category
        const sportsByCategory = (0, sportsData_1.getSportsByCategory)();
        // Fetch important stats
        const groupsCount = await prisma_1.default.group.count();
        const locationsCount = await prisma_1.default.location.count();
        const usersCount = await prisma_1.default.user.count();
        // Get most popular groups for each sport category
        const categoryHighlights = {};
        // Get popular groups and events for each category
        for (const category of sportsData_1.sportsCategories) {
            const sports = sportsByCategory[category].map(sport => sport.value);
            // Get most popular group for this category (most members)
            const topGroup = await prisma_1.default.group.findFirst({
                where: {
                    sport: {
                        in: sports
                    }
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
            const upcomingEvent = await prisma_1.default.event.findFirst({
                where: {
                    group: {
                        sport: {
                            in: sports
                        }
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
