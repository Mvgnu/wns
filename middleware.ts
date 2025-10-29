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

/**
 * Global middleware to catch JWT decryption errors
 * and handle them gracefully
 */
export async function middleware(request: NextRequest) {
  // Public paths that don't need authentication
  const publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/api/auth',
    '/_next',
    '/images',
    '/icons',
    '/favicon.ico',
  ];

  // Check if the path is public and skip token verification
  const path = request.nextUrl.pathname;
  if (publicPaths.some(pp => path.startsWith(pp))) {
    return NextResponse.next();
  }

  try {
    // Try to get the token - this is where JWT errors might occur
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Enforce onboarding completion for authenticated users
    if (token?.sub) {
      const onboardingStatus = (token as any).onboardingStatus ?? 'pending';
      const isOnboardingPath = path.startsWith('/onboarding') || path.startsWith('/api/onboarding');
      const isAuthPath = path.startsWith('/auth');

      if (onboardingStatus !== 'completed' && !isOnboardingPath && !isAuthPath && !path.startsWith('/api/auth')) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }

    // Continue normally if onboarding gate passes
    return NextResponse.next();
  } catch (error) {
    console.warn('JWT validation error in middleware:', error);
    
    // If it's an API request, return a 401 JSON response
    if (path.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error', message: 'Session expired or invalid' }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // For regular pages, clear the cookie and continue
    // This will effectively log the user out
    const response = NextResponse.next();
    
    // Remove the session cookie if present
    if (request.cookies.has('next-auth.session-token')) {
      response.cookies.delete('next-auth.session-token');
    }
    
    // Also try to delete the secure version if it exists
    if (request.cookies.has('__Secure-next-auth.session-token')) {
      response.cookies.delete('__Secure-next-auth.session-token');
    }
    
    return response;
  }
}

// Configure paths that trigger this middleware
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all protected pages
    '/profile/:path*',
    '/events/:path*',
    '/groups/:path*',
    '/settings/:path*',
    // Exclude Next.js static assets and API routes that handle their own auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 