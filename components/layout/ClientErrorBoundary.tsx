'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamic import with ssr: false is allowed in client components
const ErrorBoundary = dynamic(() => import("@/components/ErrorBoundary"), {
  ssr: false,
});

interface ClientErrorBoundaryProps {
  children: ReactNode;
}

export default function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 