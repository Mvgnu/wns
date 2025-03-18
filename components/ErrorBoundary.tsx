'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to Sentry
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Capture the error in Sentry with structured data
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    
    this.setState({ eventId });
  }

  handleReportFeedback = (): void => {
    // Open Sentry user feedback dialog if we have an event ID
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, eventId: undefined });
    
    // Try to recover by refreshing the page
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise our default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We've encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 my-2 text-sm text-gray-600 dark:text-gray-400 overflow-auto max-h-[200px]">
                {this.state.error?.toString() || 'Unknown error'}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={this.handleReportFeedback}
              >
                Report Feedback
              </Button>
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 