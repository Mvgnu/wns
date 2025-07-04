"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedGroups = getRecommendedGroups;
const prisma_1 = __importDefault(require("./prisma"));
// Calculate distance between two points in kilometers using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Helper function to check if geographic coordinates are valid
function hasValidCoordinates(entity) {
    return (entity &&
        typeof entity.latitude === 'number' &&
        typeof entity.longitude === 'number' &&
        !isNaN(entity.latitude) &&
        !isNaN(entity.longitude));
}
// Helper function to safely calculate distance only when coordinates are available
function calculateDistance(user, group) {
    if (hasValidCoordinates(user) && hasValidCoordinates(group)) {
        return getDistance(user.latitude, user.longitude, group.latitude, group.longitude);
    }
    return null;
}
async function getRecommendedGroups({ userId, limit = 5, includeLocation = true, includeSports = true, includeActivity = true, }) {
    // Get the user with their preferences
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            sports: true,
            latitude: true,
            longitude: true,
            memberGroups: {
                select: { id: true },
            },
        },
    });
    if (!user) {
        throw new Error('User not found');
    }
    // Build the query based on options
    const whereClause = {
        // Exclude groups the user is already a member of
        AND: [
            {
                NOT: {
                    id: {
                        in: user.memberGroups.map((g) => g.id),
                    },
                },
            },
            {
                // Only include public groups
                isPrivate: false,
            },
        ],
    };
    // Include sports-based recommendations
    if (includeSports && user.sports && user.sports.length > 0) {
        whereClause.OR = [
            {
                sport: {
                    in: user.sports,
                },
            },
        ];
    }
    // Get groups matching the criteria
    const groups = await prisma_1.default.group.findMany({
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
                    events: true,
                },
            },
        },
        take: limit * 2, // Get more than needed for filtering
    });
    // Calculate scores for each group
    const scoredGroups = groups.map((group) => {
        let score = 0;
        // Sport match score
        if (includeSports && user.sports && user.sports.includes(group.sport)) {
            score += 5;
        }
        // Location proximity score - safely handling possible missing columns
        if (includeLocation) {
            const distance = calculateDistance(user, group);
            if (distance !== null) {
                // Distance in kilometers, lower is better
                // Score from 0-5 based on proximity
                if (distance < 1) {
                    score += 5; // Less than 1km
                }
                else if (distance < 5) {
                    score += 4; // 1-5km
                }
                else if (distance < 10) {
                    score += 3; // 5-10km
                }
                else if (distance < 20) {
                    score += 2; // 10-20km
                }
                else if (distance < 50) {
                    score += 1; // 20-50km
                }
            }
        }
        // Activity score
        if (includeActivity) {
            // More members = more active
            if (group._count.members > 20) {
                score += 3;
            }
            else if (group._count.members > 10) {
                score += 2;
            }
            else if (group._count.members > 5) {
                score += 1;
            }
            // More events = more active
            if (group._count.events > 10) {
                score += 3;
            }
            else if (group._count.events > 5) {
                score += 2;
            }
            else if (group._count.events > 2) {
                score += 1;
            }
        }
        return Object.assign(Object.assign({}, group), { score });
    });
    // Sort by score and take the top results
    const recommendations = scoredGroups
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    return recommendations;
}
