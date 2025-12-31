'use client';

import { DashboardLayout } from '@/components/layout';
import type { SidebarItem } from '@/components/layout';
import { useAuth } from '@/lib/auth';
import { useCurrentUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

/**
 * Dashboard Layout Wrapper
 *
 * Provides consistent navigation and layout for all dashboard pages.
 * Uses DashboardLayout component with sidebar navigation and user profile.
 * Includes client-side route protection - redirects to sign-in if not authenticated.
 */
export default function DashboardLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { data: userProfile } = useCurrentUser();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarItems: SidebarItem[] = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: 'Concerts',
      href: '/concerts',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
    {
      label: 'Upload',
      href: '/media/upload',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      highlight: true,
    },
    {
      label: 'Profile',
      href: '/settings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  // Derive a friendly display name from email if no name is set
  const getDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (userProfile?.username) return userProfile.username;
    if (userProfile?.email) {
      // Extract name from email: "stefan.tumey@gmail.com" -> "Stefan Tumey"
      const namePart = userProfile.email.split('@')[0];
      return namePart
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    return 'User';
  };

  return (
    <DashboardLayout
      navbarProps={{
        logoHref: '/dashboard',
        user: userProfile
          ? {
              name: getDisplayName(),
              email: userProfile.email || '',
              avatar: userProfile.avatarUrl || undefined,
            }
          : undefined,
        onLogout: handleSignOut,
      }}
      sidebarItems={sidebarItems}
    >
      {children}
    </DashboardLayout>
  );
}
