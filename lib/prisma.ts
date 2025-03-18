// This is a standard module file - no 'use server' directive here
import { PrismaClient } from '@prisma/client';

// Global type for PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

// Determine if we're running on the server or in the browser
const isServer = typeof window === 'undefined';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// In production, it's recommended to not attach to global object
let prismaClient: PrismaClient;

// Only initialize PrismaClient on the server
if (isServer) {
  if (process.env.NODE_ENV === 'production') {
    prismaClient = new PrismaClient({
      log: ['error'],
    });
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
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