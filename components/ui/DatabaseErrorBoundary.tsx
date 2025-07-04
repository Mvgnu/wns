import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DatabaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that provides graceful error handling for database connection issues
 */
export function DatabaseErrorBoundary({
  children,
  fallback
}: DatabaseErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Listen for database error events from the global event system
  useEffect(() => {
    const handleDatabaseError = (event: CustomEvent) => {
      setHasError(true);
      setErrorDetails(event.detail?.message || 'Database connection error');
    };

    // Add global event listener for database errors
    window.addEventListener('database-error' as any, handleDatabaseError);

    return () => {
      window.removeEventListener('database-error' as any, handleDatabaseError);
    };
  }, []);

  // If a custom fallback is provided, use it
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Default error UI if no fallback is provided
  if (hasError) {
    return (
      <Alert variant="destructive" className="my-4">
        <span className="h-4 w-4">⚠️</span>
        <AlertTitle>Database Connection Error</AlertTitle>
        <AlertDescription>
          <p>We're having trouble connecting to our database. This could be due to:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Temporary server maintenance</li>
            <li>Network connectivity issues</li>
            <li>High server load</li>
          </ul>
          {errorDetails && (
            <div className="mt-2 text-xs opacity-70">
              Error details: {errorDetails}
            </div>
          )}
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <span className="mr-1">🔄</span>
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If no error, render the children
  return <>{children}</>;
}

/**
 * Helper to emit database errors from anywhere in the app
 */
export function reportDatabaseError(error: Error | string) {
  const message = typeof error === 'string' ? error : error.message;
  
  // Create and dispatch a custom event
  const event = new CustomEvent('database-error', {
    detail: { message }
  });
  
  window.dispatchEvent(event);
  
  // Also log to console
  console.error('Database error reported:', message);
} 