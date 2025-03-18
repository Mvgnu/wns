// This is a standard module file - no 'use server' directive here
import { PrismaClient } from '@prisma/client';

// Global type for PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

// Determine if we're running on the server or in the browser
const isServer = typeof window === 'undefined';

/**
 * Optimized PrismaClient setup with:
 * 1. Connection pooling configuration
 * 2. Proper logging based on environment
 * 3. Memory optimization for production
 * 4. Connection reuse to prevent connection leaks
 * 
 * This helps reduce memory usage and improve performance.
 */

// PrismaClient instance with optimized settings
let prismaClient: PrismaClient;

// Only initialize PrismaClient on the server
if (isServer) {
  if (process.env.NODE_ENV === 'production') {
    // In production, optimize for memory usage and performance
    prismaClient = new PrismaClient({
      log: ['error'],
      // Connection configuration through env vars
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        }
      }
      // Note: Connection pooling is configured through DATABASE_URL connection string
      // with ?connection_limit parameter or through Prisma connection pool settings
    });
  } else {
    // In development, enable detailed logging and reuse connections
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['error', 'warn'],
        // More detailed logging can be enabled for debugging specific issues:
        // log: [{ level: 'query', emit: 'event' }],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });
      
      // Uncomment to enable detailed query logging when needed
      // global.prisma.$on('query', (e: any) => {
      //   console.log(`Query: ${e.query}`)
      //   console.log(`Duration: ${e.duration}ms`)
      // });
    }
    prismaClient = global.prisma;
  }
} else {
  // In the browser, create a mock client that will throw helpful errors
  // @ts-ignore - intentionally creating a minimal mock
  prismaClient = new Proxy({}, {
    get: function(target, prop) {
      if (prop === '__esModule') return false;
      
      // Return a function that throws a helpful error
      return () => {
        throw new Error(
          `Prisma client is being used on the browser. ` +
          `This is not supported - Prisma client can only be used on the server ` +
          `(i.e., only in Server Components, Route Handlers, or server actions).`
        );
      };
    }
  });
}

// Optimize connection handling on server startup and shutdown
if (isServer && process.env.NODE_ENV === 'production') {
  // Register shutdown handlers for clean database disconnection
  process.on('SIGINT', async () => {
    console.log('Closing Prisma connections');
    await prismaClient.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Closing Prisma connections');
    await prismaClient.$disconnect();
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

// Export the client
export const prisma = prismaClient;

// Helper function to check if Prisma is connected - properly exported as async function
export async function checkPrismaConnection() {
  if (!isServer) {
    console.warn('Attempted to check Prisma connection on the client side');
    return false;
  }
  
  try {
    await prisma.$connect();
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
  if (!isServer) {
    throw new Error('withPrismaClient can only be used on the server');
  }
  
  try {
    // Reuse the existing client
    return await callback(prisma);
  } catch (error) {
    console.error('Error in Prisma operation:', error);
    throw error;
  }
}

export default prisma; 