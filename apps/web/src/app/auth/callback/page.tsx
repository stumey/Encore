'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * OAuth Callback Page
 *
 * Handles OAuth callbacks from social login providers (Google, Facebook, etc.)
 * This page processes the authentication code and redirects to the appropriate page.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for OAuth error in URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        // Check for authorization code
        const code = searchParams.get('code');
        if (!code) {
          setError('No authorization code received');
          setIsProcessing(false);
          return;
        }

        // Refresh user session to get the latest auth state
        await refreshUser();

        // Get the callback URL from state parameter or default to dashboard
        const state = searchParams.get('state');
        let callbackUrl = '/dashboard';

        if (state) {
          try {
            const stateData = JSON.parse(decodeURIComponent(state));
            callbackUrl = stateData.callbackUrl || callbackUrl;
          } catch (e) {
            // If state parsing fails, use default callback URL
            console.error('Failed to parse state parameter:', e);
          }
        }

        // Redirect to the appropriate page
        router.push(callbackUrl);
      } catch (err) {
        console.error('Callback processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process authentication');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, refreshUser, router, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Failed</h3>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          {isProcessing ? 'Processing authentication...' : 'Redirecting...'}
        </h2>
        <p className="mt-2 text-sm text-gray-500">Please wait a moment</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
