'use client';

import { DashboardPageHeader, DashboardSection } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  Badge,
  Spinner,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import {
  useUserStats,
  useUserArtists,
  useConcerts,
} from '@/lib/api';
import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * Statistics Page
 *
 * Displays detailed analytics about user's concert activity:
 * - Overview statistics
 * - Artist frequency breakdown
 * - Concerts per year analysis
 * - Venue map placeholder
 */
export default function StatsPage() {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: artists, isLoading: artistsLoading } = useUserArtists();
  const { data: concertsData, isLoading: concertsLoading } = useConcerts(1, 1000);
  const [activeTab, setActiveTab] = useState('overview');

  const isLoading = statsLoading || artistsLoading || concertsLoading;

  /**
   * Calculate concerts per year
   */
  const concertsPerYear = useMemo(() => {
    if (!concertsData?.data) return [];

    const yearMap = new Map<number, number>();
    concertsData.data.forEach((concert) => {
      const year = new Date(concert.concertDate).getFullYear();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });

    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  }, [concertsData]);

  /**
   * Format date to readable string
   */
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <DashboardPageHeader
        title="Statistics"
        description="Analyze your concert journey and discover your music patterns"
      />

      {/* Stats Overview Cards */}
      <DashboardSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-purple-600 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-white"
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
                <p className="text-4xl font-bold text-purple-900 mb-2">
                  {stats?.totalConcerts || 0}
                </p>
                <p className="text-sm font-medium text-purple-700">Total Concerts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-white"
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
                <p className="text-4xl font-bold text-blue-900 mb-2">
                  {stats?.uniqueArtists || 0}
                </p>
                <p className="text-sm font-medium text-blue-700">Unique Artists</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-green-600 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-white"
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
                <p className="text-4xl font-bold text-green-900 mb-2">
                  {stats?.uniqueVenues || 0}
                </p>
                <p className="text-sm font-medium text-green-700">Unique Venues</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-orange-600 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-white"
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
                <p className="text-4xl font-bold text-orange-900 mb-2">
                  {stats?.totalMedia || 0}
                </p>
                <p className="text-sm font-medium text-orange-700">Total Media</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* Detailed Stats Tabs */}
      <DashboardSection>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Seen Artist */}
              {stats?.mostSeenArtist ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Most Seen Artist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={stats.mostSeenArtist.artist.imageUrl || undefined}
                        name={stats.mostSeenArtist.artist.name}
                        size="xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {stats.mostSeenArtist.artist.name}
                        </h3>
                        <p className="text-gray-600">
                          {stats.mostSeenArtist.count} concert{stats.mostSeenArtist.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link href={`/artists/${stats.mostSeenArtist.artist.id}`}>
                        <Badge variant="primary">View</Badge>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Most Seen Artist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmptyState
                      title="No data yet"
                      description="Add concerts to see your most-seen artist"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Concert Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle>Concert Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  {concertsPerYear.length > 0 ? (
                    <div className="space-y-3">
                      {concertsPerYear.slice(0, 5).map(({ year, count }) => (
                        <div key={year} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{year}</span>
                          <div className="flex items-center gap-3 flex-1 ml-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{
                                  width: `${(count / Math.max(...concertsPerYear.map(c => c.count))) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No data yet"
                      description="Add concerts to see yearly trends"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists">
            <Card>
              <CardHeader>
                <CardTitle>Artist Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                {artists && artists.length > 0 ? (
                  <div className="space-y-4">
                    {artists.map(({ artist, concertCount, firstSeen, lastSeen }) => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={artist.imageUrl || undefined}
                          name={artist.name}
                          size="lg"
                        />
                        <div className="flex-1">
                          <Link href={`/artists/${artist.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600">
                              {artist.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600">
                            {concertCount} concert{concertCount !== 1 ? 's' : ''} • First seen {formatDate(firstSeen)} • Last seen {formatDate(lastSeen)}
                          </p>
                        </div>
                        <Badge variant={concertCount >= 5 ? 'primary' : 'secondary'}>
                          {concertCount}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No artists yet"
                    description="Start adding concerts to see your artist breakdown"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Concerts Per Year</CardTitle>
              </CardHeader>
              <CardContent>
                {concertsPerYear.length > 0 ? (
                  <div className="space-y-6">
                    {concertsPerYear.map(({ year, count }) => (
                      <div key={year}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{year}</h3>
                          <Badge variant="secondary">
                            {count} concert{count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / Math.max(...concertsPerYear.map(c => c.count))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No timeline data"
                    description="Add concerts to see your concert history over time"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues">
            <Card>
              <CardHeader>
                <CardTitle>Venue Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <svg
                    className="h-16 w-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Map Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Interactive venue map will be available in a future update
                  </p>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Quick Stats:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.uniqueVenues || 0}
                      </p>
                      <p className="text-sm text-gray-600">Unique Venues</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalConcerts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Concerts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DashboardSection>
    </div>
  );
}
