import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Use the singleton prisma instance from lib/prisma.ts
// const prisma = new PrismaClient();

// Helper to validate database schema before operations
async function ensureRequiredFields() {
  try {
    // Check if locationName exists in User table
    const fieldsExist = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'locationName'
    `);
    
    // If locationName doesn't exist, add it and other potentially missing fields
    if (fieldsExist[0].count === 0) {
      console.log('Required fields missing in User table, adding them...');
      
      // Add locationName if missing
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locationName" TEXT DEFAULT ''
      `);
      
      // Add sports array if missing
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sports" TEXT[] DEFAULT '{}'
      `);
      
      // Add interestTags array if missing
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interestTags" TEXT[] DEFAULT '{}'
      `);
      
      // Add latitude/longitude if missing
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION DEFAULT 0
      `);
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION DEFAULT 0
      `);
      
      console.log('Schema fixed, proceeding with registration...');
    }
  } catch (error) {
    console.error('Error checking/fixing schema:', error);
    // Continue anyway, we'll let the main function handle any remaining issues
  }
}

export async function POST(request: Request) {
  try {
    // Ensure required fields exist in schema before proceeding
    await ensureRequiredFields();
    
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use a more resilient query approach that won't fail if fields are missing
    const existingUserRaw = await prisma.$queryRawUnsafe(`
      SELECT "id", "email" FROM "User" WHERE "email" = $1 LIMIT 1
    `, email);
    
    const existingUser = existingUserRaw.length > 0 ? existingUserRaw[0] : null;

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all necessary default values in a way that handles missing columns
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          latitude: 0,
          longitude: 0,
          locationName: "",
          sports: [],
          interestTags: [],
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return NextResponse.json(
        {
          message: "User registered successfully",
          user: user,
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error("User creation error:", createError);
      
      // Fall back to raw SQL as a last resort if Prisma fails
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "User" ("id", "name", "email", "password", "createdAt", "updatedAt") 
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, userId, name, email, hashedPassword);
        
        return NextResponse.json(
          {
            message: "User registered successfully (fallback method)",
            user: {
              id: userId,
              name,
              email,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { status: 201 }
        );
      } catch (fallbackError) {
        console.error("Fallback creation error:", fallbackError);
        throw new Error("Could not create user using any method");
      }
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration", details: String(error) },
      { status: 500 }
    );
  }
} 