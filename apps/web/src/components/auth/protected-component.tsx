'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Protected Component Wrapper
 *
 * Wraps content that should only be visible to authenticated users.
 * Shows loading state while checking authentication.
 * Redirects unauthenticated users to sign in.
 *
 * @example
 * ```tsx
 * <ProtectedComponent>
 *   <div>This content is only visible to authenticated users</div>
 * </ProtectedComponent>
 * ```
 */
interface ProtectedComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedComponent({
  children,
  fallback,
  redirectTo = '/auth/signin',
}: ProtectedComponentProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}

/**
 * Authenticated Only Component
 *
 * Renders children only if user is authenticated, otherwise shows nothing.
 * Useful for conditional rendering without redirects.
 *
 * @example
 * ```tsx
 * <AuthenticatedOnly>
 *   <button>Sign Out</button>
 * </AuthenticatedOnly>
 * ```
 */
interface AuthenticatedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthenticatedOnly({ children, fallback = null }: AuthenticatedOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * Guest Only Component
 *
 * Renders children only if user is NOT authenticated.
 * Useful for showing sign-in/sign-up buttons to guests.
 *
 * @example
 * ```tsx
 * <GuestOnly>
 *   <button>Sign In</button>
 * </GuestOnly>
 * ```
 */
interface GuestOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function GuestOnly({ children, fallback = null }: GuestOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  return !isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * User Display Component
 *
 * Displays user information with optional custom render function.
 *
 * @example
 * ```tsx
 * <UserDisplay render={(user) => <div>Hello, {user.email}</div>} />
 * ```
 */
interface UserDisplayProps {
  render?: (user: NonNullable<ReturnType<typeof useAuth>['user']>) => ReactNode;
  fallback?: ReactNode;
}

export function UserDisplay({ render, fallback = null }: UserDisplayProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  if (render) {
    return <>{render(user)}</>;
  }

  // Default render
  return <span className="text-sm text-gray-700">{user.email || user.username}</span>;
}
