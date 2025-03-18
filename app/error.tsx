'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    console.error('Globaler Fehler von Next.js error.tsx erfasst:', error);
    
    // Capture the error in Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Etwas ist schiefgelaufen</CardTitle>
          <CardDescription>
            Wir sind auf einen unerwarteten Fehler gestoßen. Unser Team wurde benachrichtigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 my-2 text-sm text-gray-600 dark:text-gray-400 overflow-auto max-h-[200px]">
            {error.message || "Unbekannter Fehler"}
            {error.digest && (
              <div className="mt-2 text-xs text-gray-500">
                Fehler-ID: {error.digest}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Zur Startseite
          </Button>
          <Button onClick={() => reset()}>
            Erneut versuchen
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 