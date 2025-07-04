import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma, { checkPrismaConnection, getDatabaseInfo } from '@/lib/prisma';

// This endpoint provides diagnostic information about the database connection
// Only accessible to authenticated users in development mode
export async function GET(request: NextRequest) {
  // Check if this is a development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  // Get user session
  const session = await getServerSession(authOptions);
  
  // Only proceed if user is authenticated (optional security check)
  // Comment out this block if you need to debug without auth
  /* 
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  */

  try {
    // Check database connection
    const isConnected = await checkPrismaConnection();
    
    // Get environment info (sanitized)
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const sanitizedDbUrl = dbUrl.replace(
      /postgresql:\/\/([^:]+):([^@]+)@/,
      'postgresql://$1:***@'
    );

    // Get detailed database info if connected
    const dbInfo = await getDatabaseInfo();
    
    // Try a basic query
    let basicQueryResult = null;
    try {
      // Test if we can access at least one model
      const userCount = await prisma.user.count();
      basicQueryResult = { userCount };
    } catch (error) {
      basicQueryResult = { 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseConnection: {
        isConnected,
        connectionString: sanitizedDbUrl,
        info: dbInfo
      },
      basicQuery: basicQueryResult,
      prismaClientInitialized: !!prisma,
      session: {
        exists: !!session,
        userId: session?.user?.id || null
      }
    });
  } catch (error) {
    console.error('Database diagnostic error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get database diagnostics',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 