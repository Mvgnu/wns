import prisma from '@/lib/prisma';
import geolib from 'geolib';
import { User, Group } from '@prisma/client';

type RecommendationScore = {
  group: Group;
  score: number;
  reasons: string[];
};

/**
 * Calculate a recommendation score for a group based on user preferences
 */
export async function calculateGroupScore(group: Group, user: User): Promise<RecommendationScore> {
  const score: RecommendationScore = {
    group,
    score: 0,
    reasons: [],
  };
  
  // Base score for all groups
  score.score += 10;
  
  // Check if sport matches user interests
  if (user.sports && user.sports.includes(group.sport)) {
    score.score += 30;
    score.reasons.push(`Sport (${group.sport}) matches your interests`);
  }
  
  // Check location proximity if coordinates are available
  if (user.latitude && user.longitude && group.latitude && group.longitude) {
    const distance = geolib.getDistance(
      { latitude: user.latitude, longitude: user.longitude },
      { latitude: group.latitude, longitude: group.longitude }
    );
    
    // Convert distance to kilometers
    const distanceInKm = distance / 1000;
    
    // Calculate distance score (max 25 points)
    // Closer = higher score, using an inverse relationship
    // If within 5km, full points
    // If over 100km, minimal points
    let distanceScore = 0;
    
    if (distanceInKm <= 5) {
      distanceScore = 25;
      score.reasons.push('Group is very close to you');
    } else if (distanceInKm <= 20) {
      distanceScore = 20;
      score.reasons.push('Group is in your area');
    } else if (distanceInKm <= 50) {
      distanceScore = 15;
      score.reasons.push('Group is within reasonable distance');
    } else if (distanceInKm <= 100) {
      distanceScore = 10;
      score.reasons.push('Group is within your region');
    } else {
      distanceScore = 5;
    }
    
    score.score += distanceScore;
  } else if (
    user.location && 
    group.locationName && 
    user.location.toLowerCase() === group.locationName.toLowerCase()
  ) {
    // If no precise coordinates but location matches
    score.score += 20;
    score.reasons.push(`Group is in your location (${user.location})`);
  } else if (
    user.state && 
    group.state && 
    user.state.toLowerCase() === group.state.toLowerCase()
  ) {
    // If state matches
    score.score += 10;
    score.reasons.push(`Group is in your state (${user.state})`);
  }
  
  // Check activity level compatibility
  if (user.activityLevel && group.activityLevel && user.activityLevel === group.activityLevel) {
    score.score += 15;
    score.reasons.push(`Activity level (${group.activityLevel}) matches your preference`);
  }
  
  // Check for matching tags
  if (user.interestTags && group.groupTags) {
    const matchingTags = user.interestTags.filter(tag => 
      group.groupTags.includes(tag)
    );
    
    if (matchingTags.length > 0) {
      // Add points for each matching tag, up to 20 points
      const tagScore = Math.min(matchingTags.length * 5, 20);
      score.score += tagScore;
      
      if (matchingTags.length === 1) {
        score.reasons.push(`Group has a tag (${matchingTags[0]}) that matches your interests`);
      } else {
        score.reasons.push(`Group has ${matchingTags.length} tags that match your interests`);
      }
    }
  }
  
  // Check if group is active (has recent events or posts)
  try {
    // Check recent posts (last 30 days)
    const recentPostsCount = await prisma.post.count({
      where: {
        groupId: group.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
    });
    
    // Check upcoming events
    const upcomingEventsCount = await prisma.event.count({
      where: {
        groupId: group.id,
        startTime: {
          gte: new Date(), // From now
        },
      },
    });
    
    // Calculate activity score (max 20 points)
    let activityScore = 0;
    
    if (recentPostsCount > 10 && upcomingEventsCount > 2) {
      activityScore = 20;
      score.reasons.push('Group is very active with many posts and upcoming events');
    } else if (recentPostsCount > 5 || upcomingEventsCount > 1) {
      activityScore = 15;
      score.reasons.push('Group is active with regular posts and events');
    } else if (recentPostsCount > 0 || upcomingEventsCount > 0) {
      activityScore = 10;
      score.reasons.push('Group has some recent activity');
    }
    
    score.score += activityScore;
  } catch (error) {
    console.error('Error checking group activity:', error);
  }
  
  return score;
}

/**
 * Get personalized group recommendations for a user
 */
export async function getGroupRecommendations(userId: string, limit = 5): Promise<RecommendationScore[]> {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) throw new Error('User not found');
    
    // Get groups user is not already a member of
    const groups = await prisma.group.findMany({
      where: {
        NOT: {
          members: {
            some: {
              id: userId,
            },
          },
        },
        // Exclude private groups that would require invitation
        isPrivate: false,
      },
      include: {
        _count: {
          select: {
            members: true,
            events: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    if (groups.length === 0) {
      return [];
    }
    
    // Calculate scores for each group
    const recommendationScores: RecommendationScore[] = [];
    
    for (const group of groups) {
      const score = await calculateGroupScore(group, user);
      recommendationScores.push(score);
    }
    
    // Sort by score (descending) and limit
    return recommendationScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting group recommendations:', error);
    return [];
  }
}

/**
 * Log user interaction with recommendations for future improvement
 */
export async function logRecommendationInteraction(
  userId: string,
  groupId: string,
  interaction: 'viewed' | 'clicked' | 'joined' | 'dismissed',
  rating?: number
): Promise<void> {
  try {
    await prisma.recommendationFeedback.create({
      data: {
        userId,
        recommendationType: 'group',
        recommendedId: groupId,
        interaction,
        rating,
      },
    });
  } catch (error) {
    console.error('Error logging recommendation interaction:', error);
  }
} 