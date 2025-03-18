export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Schema for location creation
const locationCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"), // e.g., "skatepark", "trail", "fishing spot"
  sport: z.string().min(1, "Sport is required"), // e.g., "skating", "hiking", "fishing"
  sports: z.array(z.string()).optional().default([]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  images: z.array(
    z.union([
      z.string().url({ message: "Image must be a valid URL" }),
      z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
      z.string().length(0).transform(() => null),
      z.null()
    ])
  ).transform(arr => arr.filter(Boolean) as string[])
    .optional()
    .default([]),
  isLineBased: z.boolean().optional().default(false),
  coordinates: z.any().optional(), // JSON array of coordinates for line-based locations
});

// Schema for location update
const locationUpdateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required").optional(),
  sport: z.string().min(1, "Sport is required").optional(),
  sports: z.array(z.string()).optional(),
  address: z.string().optional(),
  images: z.array(
    z.union([
      z.string().url({ message: "Image must be a valid URL" }),
      z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
      z.string().length(0).transform(() => null),
      z.null()
    ])
  ).transform(arr => arr.filter(Boolean) as string[])
    .optional(),
  coordinates: z.any().optional(), // JSON array of coordinates for line-based locations
});

// Schema for location review creation
const locationReviewSchema = z.object({
  locationId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// GET handler for retrieving locations with filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const sport = searchParams.get("sport");
    const sports = searchParams.get("sports");
    const addedById = searchParams.get("addedById");
    const nearLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat") as string) : null;
    const nearLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng") as string) : null;
    const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius") as string) : null;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build query based on filters
    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (sport) whereClause.sport = sport;
    if (sports) {
      const sportsArray = sports.split(',');
      whereClause.OR = [
        { sport: { in: sportsArray } },
        { sports: { hasSome: sportsArray } }
      ];
    }
    if (addedById) whereClause.addedById = addedById;

    // If near coordinates and radius provided, filter by distance
    // Note: This is a simple approximation and won't work well near poles or across the international date line
    if (nearLat !== null && nearLng !== null && radius !== null) {
      // Convert radius from km to degrees (very approximate)
      const latRadius = radius / 111; // 1 degree of latitude is approximately 111 km
      const lngRadius = radius / (111 * Math.cos((nearLat * Math.PI) / 180)); // Adjust for longitude compression
      
      whereClause.AND = [
        { latitude: { gte: nearLat - latRadius } },
        { latitude: { lte: nearLat + latRadius } },
        { longitude: { gte: nearLng - lngRadius } },
        { longitude: { lte: nearLng + lngRadius } },
      ];
    }

    // Get total count for pagination
    const totalLocations = await prisma.location.count({ where: whereClause });
    
    // Get locations with additional information
    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    return NextResponse.json({
      locations,
      pagination: {
        total: totalLocations,
        pages: Math.ceil(totalLocations / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST handler for creating new locations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Location creation request body:", JSON.stringify(body, null, 2));
    
    try {
      const validatedData = locationCreateSchema.parse(body);
      console.log("Validated location data:", JSON.stringify(validatedData, null, 2));

      // If sports array is empty but sport is provided, add it to sports array
      if (validatedData.sports.length === 0 && validatedData.sport) {
        validatedData.sports = [validatedData.sport];
      }

      // Create the location
      const location = await prisma.location.create({
        data: {
          ...validatedData,
          addedById: session.user.id,
        },
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      console.log("Location created successfully:", JSON.stringify(location, null, 2));
      return NextResponse.json(location, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Location validation error:", JSON.stringify(validationError.errors, null, 2));
        return NextResponse.json(
          { error: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}

// PUT handler for updating locations
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    const validatedData = locationUpdateSchema.parse(updateData);

    // Check if the location exists and belongs to the user
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      select: { addedById: true },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    if (existingLocation.addedById !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update locations you added" },
        { status: 403 }
      );
    }

    // Update the location
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: validatedData,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            events: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing locations
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Check if the location exists and belongs to the user
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      select: { addedById: true },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    if (existingLocation.addedById !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete locations you added" },
        { status: 403 }
      );
    }

    // Check if there are any events associated with this location
    const eventsCount = await prisma.event.count({
      where: { locationId: id },
    });

    if (eventsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete location with associated events" },
        { status: 400 }
      );
    }

    // Delete reviews first, then the location
    await prisma.$transaction([
      prisma.locationReview.deleteMany({ where: { locationId: id } }),
      prisma.location.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}

// POST handler for location reviews (nested resource)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, ...data } = body;

    // Validate action type
    if (action !== "review") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const validatedData = locationReviewSchema.parse(data);
    const { locationId, rating, comment } = validatedData;

    // Check if the location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if the user has already reviewed this location
    const existingReview = await prisma.locationReview.findUnique({
      where: {
        userId_locationId: {
          userId: session.user.id,
          locationId,
        },
      },
    });

    let review;

    if (existingReview) {
      // Update the existing review
      review = await prisma.locationReview.update({
        where: {
          userId_locationId: {
            userId: session.user.id,
            locationId,
          },
        },
        data: {
          rating,
          comment,
        },
      });
    } else {
      // Create a new review
      review = await prisma.locationReview.create({
        data: {
          rating,
          comment,
          userId: session.user.id,
          locationId,
        },
      });
    }

    // Update the average rating on the location
    const reviews = await prisma.locationReview.findMany({
      where: { locationId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await prisma.location.update({
      where: { id: locationId },
      data: { rating: avgRating },
    });

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error adding/updating location review:", error);
    return NextResponse.json(
      { error: "Failed to add/update review" },
      { status: 500 }
    );
  }
} 