'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string) => {
    const errorMessages: Record<string, string> = {
      'Configuration': 'There is a problem with the server configuration. Please contact support.',
      'AccessDenied': 'You do not have permission to sign in.',
      'Verification': 'The verification link is no longer valid. It may have been used already or it has expired.',
      'OAuthSignin': 'Error in the OAuth sign-in process. Please try again.',
      'OAuthCallback': 'Error in the OAuth callback process. Please try again.',
      'OAuthCreateAccount': 'Could not create an OAuth provider account. Please try with a different provider.',
      'EmailCreateAccount': 'Could not create an email account. Please try with a different email.',
      'Callback': 'Error in the OAuth callback. Please try again.',
      'OAuthAccountNotLinked': 'To confirm your identity, sign in with the same account you used originally.',
      'EmailSignin': 'The e-mail could not be sent. Please try again later.',
      'CredentialsSignin': 'The login credentials you provided were invalid. Please check your credentials and try again.',
      'SessionRequired': 'Please sign in to access this page.',
      'Default': 'An unexpected error occurred. Please try again later.',
      'JWT_SESSION_ERROR': 'Your session has expired or is invalid. Please sign in again.',
    };
    
    return errorMessages[errorCode] || errorMessages['Default'];
  };

  // Handle JWT session errors by clearing cookies and redirecting
  useEffect(() => {
    if (error === 'JWT_SESSION_ERROR') {
      // Clear any problematic cookies by setting them to expire
      document.cookie = 'next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
      document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
      document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/; domain=' + window.location.hostname;
      
      // Optional: redirect to login after a short delay
      const redirectTimer = setTimeout(() => {
        router.push('/auth/signin');
      }, 5000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [error, router]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-xl">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900">Authentication Error</h1>
        
        <p className="text-center text-gray-700">
          {getErrorMessage(error || 'Default')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/auth/signin"
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 