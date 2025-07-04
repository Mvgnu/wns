export const dynamic = "force-static";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma, { checkPrismaConnection } from "@/lib/prisma";
import { z } from "zod";

// Define a strong validation schema for registration data
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
});

// Helper to validate database schema before operations
async function ensureRequiredFields() {
  try {
    // First check if we can connect to the database
    const connected = await checkPrismaConnection();
    if (!connected) {
      throw new Error("Cannot connect to database");
    }
    
    // Check if locationName exists in User table
    const fieldsExist = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'locationName'
    `;
    
    // If locationName doesn't exist, add it and other potentially missing fields
    if (fieldsExist[0].count === 0) {
      console.log('Required fields missing in User table, adding them...');
      
      // Add locationName if missing
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locationName" TEXT DEFAULT ''
      `;
      
      // Add sports array if missing
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sports" TEXT[] DEFAULT '{}'
      `;
      
      // Add interestTags array if missing
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interestTags" TEXT[] DEFAULT '{}'
      `;
      
      // Add latitude/longitude if missing
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION DEFAULT 0
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION DEFAULT 0
      `;
      
      console.log('Schema fixed, proceeding with registration...');
    }
  } catch (error) {
    console.error('Error checking/fixing schema:', error);
    throw error; // Rethrow so we can handle it in the main function
  }
}

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    
    // Validate input with Zod schema
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validationResult.data;

    // Ensure required fields exist in schema before proceeding
    try {
      await ensureRequiredFields();
    } catch (schemaError) {
      return NextResponse.json(
        { message: "Database schema check failed", error: String(schemaError) },
        { status: 500 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with a strong work factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with secure defaults - excluding invalid 'settings' field
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
        // Default settings should be defined in the Prisma model or handled separately
        // via a separate settings table or a valid field in the schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Log successful registration (for audit)
    console.log(`User registered successfully: ${user.id} (${user.email})`);

    // Return success without exposing sensitive data
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Generic error for security - don't expose detailed errors to client
    return NextResponse.json(
      { message: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
} 