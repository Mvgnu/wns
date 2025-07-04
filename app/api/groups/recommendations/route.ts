import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroupRecommendations, logRecommendationInteraction } from "@/lib/recommendations/group-recommendations";

// GET /api/groups/recommendations - Get personalized group recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id as string;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    // Get recommendations
    const recommendations = await getGroupRecommendations(userId, limit);
    
    // Log 'viewed' interactions
    for (const rec of recommendations) {
      await logRecommendationInteraction(userId, rec.group.id, 'viewed');
    }
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching group recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/groups/recommendations/feedback - Log user interaction with recommendations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id as string;
    
    // Parse request body
    const { groupId, interaction, rating } = await request.json();
    
    // Validate required fields
    if (!groupId || !interaction) {
      return NextResponse.json(
        { error: 'Missing required fields: groupId, interaction' },
        { status: 400 }
      );
    }
    
    // Validate interaction type
    const validInteractions = ['clicked', 'joined', 'dismissed'];
    if (!validInteractions.includes(interaction)) {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be one of: clicked, joined, dismissed' },
        { status: 400 }
      );
    }
    
    // Log interaction
    await logRecommendationInteraction(userId, groupId, interaction as any, rating);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging recommendation interaction:', error);
    return NextResponse.json(
      { error: 'Failed to log recommendation interaction' },
      { status: 500 }
    );
  }
} 