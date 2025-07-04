"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeServerSession = getSafeServerSession;
exports.isAuthenticated = isAuthenticated;
exports.getCurrentUserId = getCurrentUserId;
const next_auth_1 = require("next-auth");
const auth_1 = require("./auth");
/**
 * Safely gets the server session and handles JWT decryption errors
 *
 * @returns Safe session object or null if session cannot be retrieved
 */
async function getSafeServerSession() {
    try {
        // First check if a session cookie exists before attempting to decrypt
        // We'll try to get the session from authOptions directly, which avoids dealing with cookie parsing
        return await (0, next_auth_1.getServerSession)(auth_1.authOptions);
    }
    catch (error) {
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
async function isAuthenticated() {
    const session = await getSafeServerSession();
    return !!(session === null || session === void 0 ? void 0 : session.user);
}
/**
 * Gets the current user ID from session
 * Returns null if not authenticated or session has errors
 *
 * @returns User ID or null
 */
async function getCurrentUserId() {
    var _a;
    const session = await getSafeServerSession();
    return ((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id) || null;
}
