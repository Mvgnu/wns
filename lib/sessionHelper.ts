import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Safely gets the server session and handles JWT decryption errors
 * 
 * @returns Safe session object or null if session cannot be retrieved
 */
export async function getSafeServerSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    // Handle JWT decryption errors
    if (error instanceof Error && 
        (error.message.includes('JWT_SESSION_ERROR') || 
         error.message.includes('decryption operation failed'))) {
      console.warn('Session token decryption failed - treating as no session');
      return null;
    }
    
    // For other errors, we should still log them but return null for the session
    console.error('Unexpected session error:', error);
    return null;
  }
}

/**
 * Determines if a user is authenticated based on session
 * Handles JWT errors gracefully
 * 
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSafeServerSession();
  return !!session?.user;
}

/**
 * Gets the current user ID from session
 * Returns null if not authenticated or session has errors
 * 
 * @returns User ID or null
 */
export async function getCurrentUserId() {
  const session = await getSafeServerSession();
  return session?.user?.id || null;
} 