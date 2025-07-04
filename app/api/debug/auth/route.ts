import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { decode as decodeJwt } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Get session information
    const session = await getServerSession(authOptions);
    
    // Check NextAuth configuration
    const authConfig = {
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
      nextAuthSecretConfigured: !!process.env.NEXTAUTH_SECRET,
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0,
      cookieName: process.env.NEXTAUTH_COOKIE_NAME || 'next-auth.session-token',
      availableProviders: authOptions.providers.map(provider => provider.id)
    };
    
    // Get JWT token from request cookie (if available)
    const sessionToken = request.cookies.get(authConfig.cookieName)?.value;
    
    // Try to decode JWT token
    let tokenInfo = null;
    if (sessionToken) {
      try {
        // We're not checking signature here, just decoding the payload
        const decoded = await decodeJwt({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET || ''
        });
        
        tokenInfo = {
          decoded,
          isValid: !!decoded,
          expiresAt: decoded?.exp ? new Date(Number(decoded.exp) * 1000).toISOString() : null,
          issuedAt: decoded?.iat ? new Date(Number(decoded.iat) * 1000).toISOString() : null
        };
      } catch (error) {
        tokenInfo = {
          error: 'Failed to decode token',
          message: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      session: {
        exists: !!session,
        user: session?.user || null,
      },
      authConfig,
      cookies: {
        sessionCookieExists: !!sessionToken,
        tokenInfo
      }
    });
  } catch (error) {
    console.error('Auth diagnostic error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get auth diagnostics',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 