import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema for recommendation request
const recommendationRequestSchema = z.object({
  amenities: z.array(z.string()).optional(),
  capacity: z.number().int().positive().optional(),
  eventType: z.string().optional(),
  priceRange: z.object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional()
  }).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().positive() // in kilometers
  }).optional(),
  previousEventIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10)
});

// POST /api/places/recommendations - Get venue recommendations
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  try {
    const body = await request.json();
    const validatedData = recommendationRequestSchema.parse(body);
    
    // Base query parts
    let whereConditions = [];
    let orderByScore = [];
    
    // If amenities are provided, prioritize venues with those amenities
    if (validatedData.amenities && validatedData.amenities.length > 0) {
      const amenityIds = validatedData.amenities;
      
      // Add weight to places that have the requested amenities
      orderByScore.push(`
        (SELECT COUNT(*) FROM "PlaceAmenity" pa 
         WHERE pa."placeId" = p.id 
         AND pa."amenityId" IN (${amenityIds.map(id => `'${id}'`).join(', ')})) DESC
      `);
    }
    
    // If capacity is provided, filter venues that can accommodate
    if (validatedData.capacity) {
      whereConditions.push(`p."maxCapacity" >= ${validatedData.capacity}`);
    }
    
    // If event type is provided, prioritize venues that have hosted similar events
    if (validatedData.eventType) {
      orderByScore.push(`
        (SELECT COUNT(*) FROM "Event" e 
         WHERE e."locationId" = p.id 
         AND e."eventType" = '${validatedData.eventType}') DESC
      `);
    }
    
    // If price range is provided, filter venues within that range
    if (validatedData.priceRange) {
      if (validatedData.priceRange.min !== undefined) {
        whereConditions.push(`p."pricePerHour" >= ${validatedData.priceRange.min}`);
      }
      if (validatedData.priceRange.max !== undefined) {
        whereConditions.push(`p."pricePerHour" <= ${validatedData.priceRange.max}`);
      }
    }
    
    // If location is provided, filter venues within the radius
    if (validatedData.location) {
      const { latitude, longitude, radius } = validatedData.location;
      
      // Haversine formula to calculate distance
      orderByScore.push(`
        (6371 * acos(cos(radians(${latitude})) * cos(radians(p."latitude")) * 
        cos(radians(p."longitude") - radians(${longitude})) + 
        sin(radians(${latitude})) * sin(radians(p."latitude"))))
      `);
      
      // Filter places within the radius
      whereConditions.push(`
        (6371 * acos(cos(radians(${latitude})) * cos(radians(p."latitude")) * 
        cos(radians(p."longitude") - radians(${longitude})) + 
        sin(radians(${latitude})) * sin(radians(p."latitude")))) <= ${radius}
      `);
    }
    
    // If user has previous events, boost venues they haven't used before
    if (session?.user?.id && validatedData.previousEventIds && validatedData.previousEventIds.length > 0) {
      const previousEventIds = validatedData.previousEventIds;
      
      // Boost venues that the user hasn't used before
      orderByScore.push(`
        CASE WHEN p.id NOT IN (
          SELECT DISTINCT "locationId" FROM "Event" 
          WHERE id IN (${previousEventIds.map(id => `'${id}'`).join(', ')})
        ) THEN 1 ELSE 0 END DESC
      `);
    }
    
    // Build the complete query
    let whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    let orderByClause = orderByScore.length > 0
      ? `ORDER BY ${orderByScore.join(', ')}, p."rating" DESC`
      : 'ORDER BY p."rating" DESC';
    
    // Execute the query with a limit
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p."pricePerHour", 
        p."maxCapacity", 
        p.latitude, 
        p.longitude,
        p.address,
        p.city,
        p.rating,
        p."availabilitySchedule",
        p."mainImage",
        (
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'icon', a.icon
            )
          )
          FROM "PlaceAmenity" pa
          JOIN "Amenity" a ON a.id = pa."amenityId"
          WHERE pa."placeId" = p.id
        ) as amenities,
        (
          SELECT COUNT(*) FROM "Event" e WHERE e."locationId" = p.id
        ) as "eventCount"
      FROM "Place" p
      ${whereClause}
      ${orderByClause}
      LIMIT ${validatedData.limit}
    `;
    
    const recommendations = await prisma.$queryRawUnsafe(query);
    
    // Add score explanations for each recommendation
    const recommendationsWithScores = Array.isArray(recommendations) 
      ? recommendations.map((place, index) => {
          const scores = [];
          
          // Explain why this place was recommended
          if (validatedData.amenities && validatedData.amenities.length > 0 && place.amenities) {
            const matchedAmenities = place.amenities.filter(
              (a: any) => validatedData.amenities!.includes(a.id)
            );
            if (matchedAmenities.length > 0) {
              scores.push(`Has ${matchedAmenities.length} of your requested amenities`);
            }
          }
          
          if (validatedData.capacity && place.maxCapacity >= validatedData.capacity) {
            scores.push(`Can accommodate ${place.maxCapacity} attendees`);
          }
          
          if (place.rating) {
            scores.push(`Highly rated (${place.rating}/5)`);
          }
          
          if (place.eventCount > 0) {
            scores.push(`Hosted ${place.eventCount} events`);
          }
          
          return {
            ...place,
            recommendationScore: 100 - (index * 5), // Simple score based on rank
            recommendationReasons: scores
          };
        })
      : [];
    
    return NextResponse.json({
      recommendations: recommendationsWithScores
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
} 