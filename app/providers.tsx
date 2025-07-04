'use client';

import React, { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { DatabaseErrorBoundary } from '@/components/ui/DatabaseErrorBoundary';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Application Providers
 * 
 * Wraps the application with necessary providers and error boundaries
 */
export default function Providers({ children }: ProvidersProps) {
  // State to handle general errors
  const [error, setError] = useState<Error | null>(null);

  // Set up global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Render error UI if there's an error
  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="mb-4 text-gray-600">
          We&apos;ve encountered an unexpected error. Please try again or refresh the page.
        </p>
        <div className="text-sm bg-gray-100 p-4 rounded mb-4 overflow-auto text-left">
          <pre>{error.message}</pre>
        </div>
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <SessionProvider
      // Add session configuration for better persistence
      refetchInterval={600} // Refetch session every 10 minutes
      refetchOnWindowFocus={true} // Refetch when window is focused
      refetchWhenOffline={false} // Don't refetch when offline
    >
      <DatabaseErrorBoundary>
        {children}
      </DatabaseErrorBoundary>
    </SessionProvider>
  );
} 