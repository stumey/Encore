'use client';

import { DashboardPageHeader, DashboardSection } from '@/components/layout';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Avatar,
  EmptyState,
  ConcertCardSkeleton,
} from '@/components/ui';
import {
  useCurrentUser,
  useUserStats,
  useConcerts,
} from '@/lib/api';
import { OnThisDay } from '@/components/dashboard/on-this-day';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';
import { useOnboarding } from '@/hooks/use-onboarding';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';

/**
 * Main Dashboard Page
 *
 * Displays an overview of user's concert activity including:
 * - Welcome message with user info
 * - Quick statistics cards
 * - Most-seen artist highlight
 * - Recent concerts list
 * - Quick action buttons
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: concertsData, isLoading: concertsLoading } = useConcerts(1, 5);
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Memoize loading state to prevent unnecessary recalculations
  const isLoading = useMemo(
    () => userLoading || statsLoading,
    [userLoading, statsLoading]
  );

  // Memoize recent concerts to prevent unnecessary re-renders
  const recentConcerts = useMemo(
    () => concertsData?.data ?? [],
    [concertsData?.data]
  );

  /**
   * Format date to readable string using memoized Intl.DateTimeFormat
   */
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    []
  );

  const formatDate = useCallback(
    (date: string | Date) => dateFormatter.format(new Date(date)),
    [dateFormatter]
  );

  // Memoize navigation handlers to prevent recreating on each render
  const handleUploadMedia = useCallback(
    () => router.push('/media/upload'),
    [router]
  );

  const handleAddConcert = useCallback(
    () => router.push('/concerts/new'),
    [router]
  );

  // Memoize user display name
  const userName = useMemo(
    () => user?.displayName || user?.username || 'there',
    [user?.displayName, user?.username]
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Handle error states
  if (userError || statsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Error Loading Dashboard"
          description="We encountered an issue loading your data. Please try refreshing the page."
          action={{
            label: 'Refresh Page',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <DashboardPageHeader
        title={`Welcome back, ${userName}!`}
        description="Here's what's happening with your concert collection"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleUploadMedia}
            >
              <svg
                className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:-translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload Media
            </Button>
            <Button onClick={handleAddConcert}>
              <svg
                className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Concert
            </Button>
          </div>
        }
      />

      {/* Quick Stats Grid */}
      <DashboardSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Concerts"
            value={stats?.totalConcerts || 0}
            gradient="purple"
            animationDelay={0}
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            }
          />
          <StatCard
            label="Unique Artists"
            value={stats?.uniqueArtists || 0}
            gradient="blue"
            animationDelay={75}
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Unique Venues"
            value={stats?.uniqueVenues || 0}
            gradient="green"
            animationDelay={150}
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Media"
            value={stats?.totalMedia || 0}
            gradient="orange"
            animationDelay={225}
            icon={
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </DashboardSection>

      {/* On This Day - Concert memories from this date in previous years */}
      <OnThisDay />

      {/* Most Seen Artist */}
      {stats?.mostSeenArtist && (
        <DashboardSection
          title="Most Seen Artist"
          description="Your favorite artist based on concert attendance"
        >
          <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <Card className="relative hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-950/30 pointer-events-none" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-lg opacity-30" />
                    <Avatar
                      src={stats.mostSeenArtist.artist.imageUrl || undefined}
                      name={stats.mostSeenArtist.artist.name}
                      size="xl"
                      className="relative"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.mostSeenArtist.artist.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Seen {stats.mostSeenArtist.count} time{stats.mostSeenArtist.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href={`/artists/${stats.mostSeenArtist.artist.id}`}>
                    <Button variant="outline">View Artist</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardSection>
      )}

      {/* Recent Concerts */}
      <DashboardSection
        title="Recent Concerts"
        description="Your latest concert experiences"
        actions={
          <Link href="/concerts">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        }
      >
        {concertsLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ConcertCardSkeleton />
              </div>
            ))}
          </div>
        ) : recentConcerts.length === 0 ? (
          <EmptyState
            title="No concerts yet"
            description="Start adding your concert experiences to build your music journey."
            actions={
              <Button onClick={handleAddConcert}>
                Add Your First Concert
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {recentConcerts.map((concert, index) => (
              <div
                key={concert.id}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
              <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {concert.artists.map((ca) => ca.artist.name).join(', ')}
                        </h3>
                        {concert._count && concert._count.media > 0 && (
                          <Badge variant="secondary">
                            {concert._count.media} photo{concert._count.media !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{formatDate(concert.concertDate)}</span>
                        </div>
                        {concert.venue && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{concert.venue.name}</span>
                          </div>
                        )}
                      </div>
                      {concert.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {concert.notes}
                        </p>
                      )}
                    </div>
                    <Link href={`/concerts/${concert.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Welcome Modal for new users */}
      <WelcomeModal
        isOpen={showOnboarding}
        onClose={completeOnboarding}
      />
    </div>
  );
}
