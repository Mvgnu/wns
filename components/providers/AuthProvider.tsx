'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * AuthProvider wraps the application with NextAuth SessionProvider
 * for persistent authentication in both development and production
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Force re-fetching the session every 10 minutes to handle expirations
      refetchInterval={600}
      // Re-fetch on window focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

export default AuthProvider; 