// This is a standard module file - no 'use server' directive here
import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;

// Log connection attempts for debugging
const connectionLogger = (message: string) => {
  console.log(`[Prisma] ${message}`);
};

// Run post-connection hooks after Prisma connects
prisma.$use(async (params, next) => {
  const before = Date.now();
  try {
    const result = await next(params);
    const after = Date.now();
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && (after - before) > 100) {
      console.log(`Slow query detected (${after - before}ms): ${params.model}.${params.action}`);
    }
    
    return result;
  } catch (error) {
    const after = Date.now();
    console.error(`Query error after ${after - before}ms: ${params.model}.${params.action}`, error);
    throw error;
  }
});

// Export the client
export async function checkPrismaConnection() {
  try {
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    connectionLogger('Successfully connected to database');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

/**
 * Utility to ensure queries are properly disconnected
 * Useful for long-running operations or scripts
 */
export async function withPrismaClient<T>(callback: (client: PrismaClient) => Promise<T>): Promise<T> {
  try {
    // Test connection first
    await checkPrismaConnection();
    // Reuse the existing client
    return await callback(prisma);
  } catch (error) {
    console.error('Error in Prisma operation:', error);
    throw error;
  }
}

// Get database connection information for diagnostics
export async function getDatabaseInfo() {
  if (process.env.NODE_ENV === 'production') {
    return { status: 'Production mode - info hidden' };
  }
  
  try {
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    return {
      connected: true,
      info: result
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Optimize connection handling on server startup and shutdown
if (process.env.NODE_ENV === 'production') {
  // Register shutdown handlers for clean database disconnection
  process.on('SIGINT', async () => {
    connectionLogger('Closing Prisma connections');
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    connectionLogger('Closing Prisma connections');
    await prisma.$disconnect();
    process.exit(0);
  });
}

// If we're in a static build, return a mock Prisma client that doesn't try to connect to a database
if (process.env.SKIP_DATABASE_CALLS === 'true') {
  const mockPrismaClient = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    // Add other methods and models as needed with empty mock implementations
    user: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      // Add other methods as needed
    },
    post: {
      findMany: () => Promise.resolve([]),
      // Add other methods as needed
    },
    // Add other models as needed
    // This is just a minimal mock to prevent database connection errors during build
  };
  
  // @ts-ignore - We know this is not a complete implementation
  global.prisma = mockPrismaClient as PrismaClient;
} 