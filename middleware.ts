import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes that require authentication
const protectedRoutes = [
  '/api/posts',
  '/api/comments',
  '/api/groups',
  '/api/locations',
  '/api/events',
  '/api/profile',
];

// API routes that are exempt from protection (public)
const publicApiRoutes = [
  '/api/auth',
];

// API routes that allow public GET requests but require auth for other methods
const publicReadRoutes = [
  '/api/groups',
  '/api/locations',
  '/api/events',
  '/api/posts',
];

// Simple in-memory rate limiter
// In production, use a Redis-based solution
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

export async function middleware(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  
  // Handle API rate limiting
  if (requestPath.startsWith('/api/')) {
    // Get client IP from X-Forwarded-For header or use a default value
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
    const now = Date.now();
    
    // Get or create rate limit entry
    let rateLimit = rateLimitMap.get(ip);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      rateLimitMap.set(ip, rateLimit);
    }
    
    // Increment count
    rateLimit.count++;
    
    // Check if rate limit exceeded
    if (rateLimit.count > RATE_LIMIT_MAX) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          },
        }
      );
    }
    
    // Set rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - rateLimit.count).toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());
    
    // Don't check authentication for public routes
    if (publicApiRoutes.some(route => requestPath.startsWith(route))) {
      return response;
    }
    
    // Allow GET requests to public read routes
    if (request.method === 'GET' && publicReadRoutes.some(route => requestPath.startsWith(route))) {
      return response;
    }
    
    // Check authentication for protected routes
    if (protectedRoutes.some(route => requestPath.startsWith(route))) {
      const token = await getToken({ req: request });
      
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return response;
  }
  
  // Continue for non-API routes
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: ['/api/:path*'],
}; 