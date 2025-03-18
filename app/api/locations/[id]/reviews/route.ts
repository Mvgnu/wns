import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notificationService";

// Schema for review validation
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
});

// POST handler for creating a new review
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have the locationId before proceeding
    const locationId = params.id;
    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, name: true, addedById: true, addedBy: { select: { id: true } } },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this location
    const existingReview = await prisma.locationReview.findFirst({
      where: {
        locationId,
        userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this location" },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Create the review
    const review = await prisma.locationReview.create({
      data: {
        userId,
        locationId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update location average rating
    const averageRating = await prisma.locationReview.aggregate({
      where: {
        locationId,
      },
      _avg: {
        rating: true,
      },
    });

    await prisma.location.update({
      where: { id: locationId },
      data: {
        rating: averageRating._avg.rating || 0,
      },
    });

    // Notify location creator about the new review
    if (location.addedById !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: location.addedById,
          type: "LOCATION_REVIEW",
          message: `${session.user.name || "Someone"} reviewed your location: ${location.name}`,
          relatedId: locationId,
          actorId: userId,
          read: false,
        },
      });

      // Send real-time notification
      sendNotificationToUser(location.addedById, notification);
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// GET handler for fetching reviews for a location
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have the locationId before proceeding
    const locationId = params.id;
    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Fetch reviews for the location
    const reviews = await prisma.locationReview.findMany({
      where: {
        locationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
} 