'use client';

import { DashboardPageHeader, DashboardSection } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Avatar,
  Spinner,
  EmptyState,
} from '@/components/ui';
import {
  useCurrentUser,
  useUserStats,
  useConcerts,
} from '@/lib/api';
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
  const { data: concertsData, isLoading: concertsLoading, error: concertsError } = useConcerts(1, 5);

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" className="text-purple-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
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
                className="h-5 w-5 mr-2"
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
                className="h-5 w-5 mr-2"
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
          {/* Total Concerts */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Concerts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalConcerts || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unique Artists */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Artists</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.uniqueArtists || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unique Venues */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Venues</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.uniqueVenues || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Media */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Media</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalMedia || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* Most Seen Artist */}
      {stats?.mostSeenArtist && (
        <DashboardSection
          title="Most Seen Artist"
          description="Your favorite artist based on concert attendance"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar
                  src={stats.mostSeenArtist.artist.imageUrl || undefined}
                  name={stats.mostSeenArtist.artist.name}
                  size="xl"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.mostSeenArtist.artist.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Seen {stats.mostSeenArtist.count} time{stats.mostSeenArtist.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link href={`/artists/${stats.mostSeenArtist.artist.id}`}>
                  <Button variant="outline">View Artist</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
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
            {recentConcerts.map((concert) => (
              <Card key={concert.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {concert.artists.map((ca) => ca.artist.name).join(', ')}
                        </h3>
                        {concert._count && concert._count.media > 0 && (
                          <Badge variant="secondary">
                            {concert._count.media} photo{concert._count.media !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
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
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
