"use strict";
/**
 * Test Utilities
 *
 * Helper functions for testing the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockSession = createMockSession;
exports.mockFetch = mockFetch;
exports.createTestData = createTestData;
exports.cleanupTestData = cleanupTestData;
/**
 * Creates a mock session for testing
 *
 * @param user The user object to create a session for
 * @returns A mock Session object
 */
function createMockSession(user) {
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
}
/**
 * Mock fetch implementation for testing API routes
 *
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns A mock Response object
 */
async function mockFetch(url, options = {}) {
    // Here you would implement a mock version of fetch that doesn't actually make 
    // HTTP requests but returns predetermined responses based on the URL and options
    // This is a placeholder implementation
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
/**
 * Helper to create test data in the database
 *
 * @param prisma PrismaClient instance
 */
async function createTestData(prisma) {
    // Create test users, groups, events, etc.
    // This is useful for setting up test data before running tests
    // Example implementation
    const user = await prisma.user.create({
        data: {
            name: 'Test User',
            email: 'test@example.com',
        }
    });
    return { user };
}
/**
 * Helper to clean up test data from the database
 *
 * @param prisma PrismaClient instance
 * @param data Data created by createTestData
 */
async function cleanupTestData(prisma, data) {
    // Cleanup all test data created by createTestData
    // Example implementation
    if (data.user) {
        await prisma.user.delete({
            where: { id: data.user.id }
        });
    }
}
