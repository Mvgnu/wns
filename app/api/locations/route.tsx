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
  // Free-form legacy type coming from UI; will be mapped to detailType/placeType
  type: z.string().min(1, "Type is required"), // e.g., "trail", "skatepark"
  // Primary sport is required
  sport: z.string().min(1, "Sport is required"),
  sports: z.array(z.string()).optional().default([]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  images: z
    .array(
      z.union([
        z.string().url({ message: "Image must be a valid URL" }),
        z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
        z.string().length(0).transform(() => null),
        z.null(),
      ])
    )
    .transform((arr) => arr.filter(Boolean) as string[])
    .optional()
    .default([]),
  isLineBased: z.boolean().optional().default(false),
  coordinates: z.any().optional(), // JSON array of coordinates for line-based locations
  // Optional enhanced fields
  placeType: z.string().optional(),
  detailType: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  priceRange: z.string().optional(),
  capacity: z.number().optional(),
  hasParking: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  openingHours: z.any().optional(),
  difficulty: z.string().optional(),
  distance: z.number().optional(),
  elevation: z.number().optional(),
  // Amenities can be list of type ids or detailed objects
  amenities: z
    .array(
      z.union([
        z.string(),
        z.object({
          type: z.string(),
          isAvailable: z.boolean().optional(),
          name: z.string().optional(),
          details: z.any().optional(),
        }),
      ])
    )
    .optional(),
});

// Schema for location update
const locationUpdateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional(),
  // Allow updating legacy type which will be mapped to detailType/placeType
  type: z.string().optional(),
  sport: z.string().min(1, "Sport is required").optional(),
  sports: z.array(z.string()).optional(),
  address: z.string().optional(),
  images: z
    .array(
      z.union([
        z.string().url({ message: "Image must be a valid URL" }),
        z.string().startsWith('/uploads/', { message: "Image must be a valid path" }),
        z.string().length(0).transform(() => null),
        z.null(),
      ])
    )
    .transform((arr) => arr.filter(Boolean) as string[])
    .optional(),
  coordinates: z.any().optional(), // JSON array of coordinates for line-based locations
  placeType: z.string().optional(),
  detailType: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  priceRange: z.string().optional(),
  capacity: z.number().optional(),
  hasParking: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  openingHours: z.any().optional(),
  difficulty: z.string().optional(),
  distance: z.number().optional(),
  elevation: z.number().optional(),
  amenities: z
    .array(
      z.union([
        z.string(),
        z.object({
          type: z.string(),
          isAvailable: z.boolean().optional(),
          name: z.string().optional(),
          details: z.any().optional(),
        }),
      ])
    )
    .optional(),
});

// Schema for location review creation
const locationReviewSchema = z.object({
  locationId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

function inferPlaceType(detailType: string | undefined, isLineBased?: boolean): string {
  const t = (detailType || '').toLowerCase();
  if (isLineBased) return 'trail';
  if (/(trail|route|hiking|biking|running)/.test(t)) return 'trail';
  if (/(gym|studio|skatepark|court|field|pool|hall|arena)/.test(t)) return 'facility';
  return 'spot';
}

function toAmenityEnum(typeId: string): string {
  return typeId.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function toDisplayName(idOrName?: string): string | undefined {
  if (!idOrName) return undefined;
  const s = idOrName.replace(/[_-]+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// GET handler for retrieving locations with filtering or by id/slug
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      // First try to find by slug, then by ID for backward compatibility
      let location = await prisma.location.findUnique({
        where: { slug: id },
        include: {
          addedBy: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true, events: true } },
          amenities: true,
          reviews: { select: { rating: true, comment: true, createdAt: true } },
          staff: true,
          claims: {
            where: { status: 'APPROVED' },
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      });

      // If not found by slug, try by ID
      if (!location) {
        location = await prisma.location.findUnique({
          where: { id },
          include: {
            addedBy: { select: { id: true, name: true, image: true } },
            _count: { select: { reviews: true, events: true } },
            amenities: true,
            reviews: { select: { rating: true, comment: true, createdAt: true } },
            staff: true,
            claims: {
              where: { status: 'APPROVED' },
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
        });
      }

      if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }
      return NextResponse.json(location);
    }

    const type = searchParams.get("type");
    const sport = searchParams.get("sport");
    const sports = searchParams.get("sports");
    const addedById = searchParams.get("addedById");
    const amenitiesParam = searchParams.get("amenities");
    const difficulty = searchParams.get("difficulty");
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
        { sports: { hasSome: sportsArray } },
      ];
    }
    if (difficulty) whereClause.difficulty = difficulty;
    if (amenitiesParam) {
      const amenityTypes = amenitiesParam.split(',').map((a) => toAmenityEnum(a));
      whereClause.amenities = { some: { type: { in: amenityTypes } } };
    }
    if (addedById) whereClause.addedById = addedById;

    if (nearLat !== null && nearLng !== null && radius !== null) {
      const latRadius = radius / 111;
      const lngRadius = radius / (111 * Math.cos((nearLat * Math.PI) / 180));
      whereClause.AND = [
        { latitude: { gte: nearLat - latRadius } },
        { latitude: { lte: nearLat + latRadius } },
        { longitude: { gte: nearLng - lngRadius } },
        { longitude: { lte: nearLng + lngRadius } },
      ];
    }

    const totalLocations = await prisma.location.count({ where: whereClause });

    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        addedBy: { select: { id: true, name: true, image: true } },
        _count: { select: { reviews: true, events: true } },
        amenities: true,
      },
      orderBy: { createdAt: "desc" },
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
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

// POST handler for creating new locations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Location creation request body:", JSON.stringify(body, null, 2));

    try {
      const validatedData = locationCreateSchema.parse(body);
      console.log("Validated location data:", JSON.stringify(validatedData, null, 2));

      // Ensure sports include primary sport
      const sportsArray = (validatedData.sports || []).length > 0
        ? validatedData.sports!
        : [validatedData.sport];

      // Derive detailType/placeType if missing
      const derivedDetailType = validatedData.detailType || validatedData.type;
      const derivedPlaceType = validatedData.placeType || inferPlaceType(derivedDetailType, validatedData.isLineBased);

      // Build create payload matching Prisma model
      const createData: any = {
        name: validatedData.name,
        description: validatedData.description,
        placeType: derivedPlaceType,
        detailType: derivedDetailType,
        sport: validatedData.sport,
        sports: sportsArray,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        address: validatedData.address,
        image: (validatedData.images && validatedData.images[0]) || null,
        images: validatedData.images || [],
        website: validatedData.website,
        phone: validatedData.phone,
        email: validatedData.email,
        priceRange: validatedData.priceRange,
        capacity: validatedData.capacity,
        hasParking: validatedData.hasParking,
        isAccessible: validatedData.isAccessible,
        openingHours: validatedData.openingHours as any,
        isLineBased: validatedData.isLineBased || false,
        coordinates: validatedData.coordinates as any,
        difficulty: validatedData.difficulty,
        distance: validatedData.distance,
        elevation: validatedData.elevation,
        addedById: session.user.id,
      };

      const location = await prisma.location.create({
        data: createData,
        include: {
          addedBy: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true } },
        },
      });

      // Create amenities if provided
      if (validatedData.amenities && validatedData.amenities.length > 0) {
        const amenityInputs = validatedData.amenities.map((a) =>
          typeof a === 'string'
            ? { type: toAmenityEnum(a), name: toDisplayName(a), isAvailable: true }
            : { type: toAmenityEnum(a.type), name: a.name || toDisplayName(a.type), isAvailable: a.isAvailable ?? true, details: a.details }
        );

        await Promise.all(
          amenityInputs.map((am) =>
            prisma.placeAmenity.upsert({
              where: {
                locationId_type: { locationId: location.id, type: am.type as any },
              },
              update: {
                name: am.name || undefined,
                isAvailable: am.isAvailable,
                details: am.details as any,
              },
              create: {
                locationId: location.id,
                type: am.type as any,
                name: am.name || '',
                isAvailable: am.isAvailable,
                details: am.details as any,
              },
            })
          )
        );
      }

      console.log("Location created successfully:", JSON.stringify(location, null, 2));
      return NextResponse.json(location, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Location validation error:", JSON.stringify(validationError.errors, null, 2));
        return NextResponse.json({ error: validationError.errors }, { status: 400 });
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}

// PUT handler for updating locations
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get('id');

    const body = await req.json();
    const { id: idFromBody, ...updateDataRaw } = body || {};
    const idParam = idFromBody || idFromQuery;

    if (!idParam) {
      return NextResponse.json({ error: "Location ID or slug is required" }, { status: 400 });
    }

    const validatedData = locationUpdateSchema.parse(updateDataRaw || {});

    // First try to find by slug, then by ID for backward compatibility
    let existingLocation = await prisma.location.findUnique({
      where: { slug: idParam },
      select: { id: true, addedById: true }
    });

    // If not found by slug, try by ID
    if (!existingLocation) {
      existingLocation = await prisma.location.findUnique({
        where: { id: idParam },
        select: { id: true, addedById: true }
      });
    }
    if (!existingLocation) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    if (existingLocation.addedById !== session.user.id) return NextResponse.json({ error: "You can only update locations you added" }, { status: 403 });

    const detailType = validatedData.detailType || validatedData.type;
    const placeType = validatedData.placeType || (detailType ? inferPlaceType(detailType, (validatedData as any).isLineBased) : undefined);

    const updateData: any = {
      ...validatedData,
      ...(detailType ? { detailType } : {}),
      ...(placeType ? { placeType } : {}),
      ...(validatedData.images ? { image: validatedData.images[0] || null } : {}),
    };
    delete updateData.type;

    const updatedLocation = await prisma.location.update({
      where: { id: existingLocation.id },
      data: updateData,
      include: { addedBy: { select: { id: true, name: true, image: true } }, _count: { select: { reviews: true, events: true } }, amenities: true },
    });

    // If amenities were provided, upsert them
    if (validatedData.amenities && validatedData.amenities.length > 0) {
      const amenityInputs = validatedData.amenities.map((a) =>
        typeof a === 'string'
          ? { type: toAmenityEnum(a), name: toDisplayName(a), isAvailable: true }
          : { type: toAmenityEnum(a.type), name: a.name || toDisplayName(a.type), isAvailable: a.isAvailable ?? true, details: a.details }
      );
      await Promise.all(
        amenityInputs.map((am) =>
          prisma.placeAmenity.upsert({
            where: { locationId_type: { locationId: id, type: (am.type as any) } },
            update: { name: am.name || undefined, isAvailable: am.isAvailable, details: am.details as any },
            create: { locationId: id, type: (am.type as any), name: am.name || '', isAvailable: am.isAvailable, details: am.details as any },
          })
        )
      );
    }

    return NextResponse.json(updatedLocation);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Error updating location:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

// DELETE handler for removing locations
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
    }

    // Check if the location exists and belongs to the user
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      select: { addedById: true },
    });

    if (!existingLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    if (existingLocation.addedById !== session.user.id) {
      return NextResponse.json({ error: "You can only delete locations you added" }, { status: 403 });
    }

    // Check if there are any events associated with this location
    const eventsCount = await prisma.event.count({ where: { locationId: id } });

    if (eventsCount > 0) {
      return NextResponse.json({ error: "Cannot delete location with associated events" }, { status: 400 });
    }

    // Delete reviews first, then the location
    await prisma.$transaction([
      prisma.locationReview.deleteMany({ where: { locationId: id } }),
      prisma.location.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}

// POST handler for location reviews (nested resource)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    // Validate action type
    if (action !== "review") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const validatedData = locationReviewSchema.parse(data);
    const { locationId, rating, comment } = validatedData;

    // Check if the location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
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
        data: { rating, comment },
      });
    } else {
      // Create a new review
      review = await prisma.locationReview.create({
        data: { rating, comment, userId: session.user.id, locationId },
      });
    }

    // Update the average rating on the location
    const reviews = await prisma.locationReview.findMany({
      where: { locationId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.location.update({ where: { id: locationId }, data: { rating: avgRating } });

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error adding/updating location review:", error);
    return NextResponse.json({ error: "Failed to add/update review" }, { status: 500 });
  }
} 