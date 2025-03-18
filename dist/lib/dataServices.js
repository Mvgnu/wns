"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSportImagePath = getSportImagePath;
exports.getHomePageData = getHomePageData;
// ^ Ensure server-side execution
const prisma_1 = require("./prisma");
const sportsData_1 = require("./sportsData");
const next_1 = require("next-auth/next");
const auth_1 = require("@/lib/auth");
/**
 * Get the image path for a specific sport
 * @param sport - The sport value to get the image for
 * @returns The path to the sport image or a default image if not found
 */
async function getSportImagePath(sport) {
    try {
        if (!sport)
            return '/images/default-sport.jpg';
        console.log(`Looking for image for sport: ${sport}`);
        // Just return the expected path without checking file existence
        // This is more reliable in production and Next.js builds
        const normalizedSport = sport.replace(/\s+/g, '_');
        const imagePath = `/images/sports/sport-${normalizedSport}.jpg`;
        // Log for debugging
        console.log(`Using image path: ${imagePath}`);
        return imagePath;
    }
    catch (error) {
        console.error('Error finding sport image:', error);
        return '/images/default-sport.jpg';
    }
}
/**
 * Data fetching service for the homepage
 * This centralizes all database queries for better organization and testability
 */
async function getHomePageData() {
    var _a;
    try {
        // Get current user session for conditional privacy filtering
        const session = await (0, next_1.getServerSession)(auth_1.authOptions);
        const userId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get all sports organized by category
        const sportsByCategory = (0, sportsData_1.getSportsByCategory)();
        // Fetch important stats - only count public entities for non-logged in users
        const statsPromises = [
            // For groups, only count public ones for non-logged in users
            prisma_1.prisma.group.count({
                where: userId ? undefined : { isPrivate: false }
            }),
            // For locations, all are public
            prisma_1.prisma.location.count(),
            // For users, all user counts are public
            prisma_1.prisma.user.count()
        ];
        const [groupsCount, locationsCount, usersCount] = await Promise.all(statsPromises);
        // Get most popular groups for each sport category
        const categoryHighlights = {};
        // Prepare all category highlights in parallel
        await Promise.all(Object.keys(sportsByCategory).map(async (category) => {
            // Get highlights for each sport in the category in parallel
            const sportHighlights = await Promise.all(sportsByCategory[category].map(async (sport) => {
                try {
                    // Build appropriate privacy filter based on user login status
                    let groupWhereInput;
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
                    }
                    else {
                        // For non-logged in users, only show public groups
                        groupWhereInput = {
                            sport: sport.value,
                            isPrivate: false
                        };
                    }
                    // Get most popular group for this specific sport
                    const topGroup = await prisma_1.prisma.group.findFirst({
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
                    const upcomingEvent = await prisma_1.prisma.event.findFirst({
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
                }
                catch (error) {
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
            }));
            // Filter out sports with no highlights to optimize the payload
            categoryHighlights[category] = sportHighlights.filter(highlight => highlight.topGroup !== null || highlight.upcomingEvent !== null);
        }));
        // Get all sport image paths from the local filesystem
        const sportImages = {};
        await Promise.all(Object.values(sportsByCategory).flat().map(async (sport) => {
            sportImages[sport.value] = await getSportImagePath(sport.value);
        }));
        return {
            sportsByCategory,
            groupsCount,
            locationsCount,
            usersCount,
            categoryHighlights,
            sportImages
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
            categoryHighlights: {},
            sportImages: {}
        };
    }
}
