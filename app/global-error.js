'use client';

import * as Sentry from '@sentry/nextjs';
import { Geist } from 'next/font/google';
import { Button } from '@/components/ui/button';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function GlobalError({
  error,
  reset,
}) {
  // Log the error to Sentry
  Sentry.captureException(error);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              We're sorry, but there was an unexpected error. Our team has been notified.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 my-4 text-sm text-gray-600 dark:text-gray-400 overflow-auto max-h-[200px] text-left">
              {error?.message || 'Unknown error'}
            </div>
            <Button
              onClick={() => reset()}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
} 