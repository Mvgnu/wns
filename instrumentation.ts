import * as Sentry from '@sentry/nextjs';
import { registerServerConfig } from './instrumentation.server';
import { registerEdgeConfig } from './instrumentation.edge';
import type { NextRequest, NextResponse } from 'next/server';

// This file will be imported in any environment (edge, server, etc)
export function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    registerEdgeConfig();
  } else {
    registerServerConfig();
  }
}

// Hook to capture request errors from nested React Server Components
export function onRequestError({ 
  request, 
  response, 
  error 
}: { 
  request: NextRequest | Request | undefined; 
  response: NextResponse | Response | undefined; 
  error: Error;
}) {
  try {
    if (request && response) {
      // @ts-ignore - Sentry types might not match exactly with NextRequest/NextResponse
      Sentry.captureRequestError(error, request, response);
    } else {
      // Fallback to capture exception if request or response is missing
      Sentry.captureException(error);
    }
  } catch (sentryError) {
    // Fallback if Sentry capture fails
    console.error('Error capturing in Sentry:', error);
    Sentry.captureException(error);
  }
} 