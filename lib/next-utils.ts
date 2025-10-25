import { NextRequest } from 'next/server';

/**
 * Utility to handle Next.js 15 async params compatibility
 * In Next.js 15, params is now a Promise that needs to be awaited
 */
export async function getParams<T extends Record<string, string>>(
  request: NextRequest,
  context: { params: Promise<T> }
): Promise<T> {
  return await context.params;
}

/**
 * Type-safe params extractor for route handlers
 */
export function createRouteHandler<T extends Record<string, string>>(
  handler: (request: NextRequest, params: T) => Promise<Response>
) {
  return async (request: NextRequest, context: { params: Promise<T> }) => {
    const params = await context.params;
    return handler(request, params);
  };
} 