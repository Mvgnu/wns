import { NextRequest } from 'next/server';

// Test utilities for dynamic URL generation

/**
 * Get the base URL for tests based on environment variables
 */
export function getBaseUrl(): string {
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/**
 * Create a NextRequest with the dynamic base URL
 */
export function createTestRequest(url: string, options?: RequestInit): NextRequest {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  return new NextRequest(fullUrl, options);
}
