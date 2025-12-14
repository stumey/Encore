'use client';

import { use, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVenue } from '@/lib/api';
import { ConcertCard } from '@/components/concerts/concert-card';
import { DashboardSection } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
  EmptyState,
  Badge,
} from '@/components/ui';

interface VenueDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Venue Detail Page
 *
 * Displays comprehensive information about a specific venue:
 * - Venue header with name, location, capacity
 * - Concert statistics
 * - List of concerts attended at this venue
 * - Map showing venue location (placeholder for now)
 */
export default function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: venueData, isLoading, error } = useVenue(id);

  /**
   * Format location string from venue data
   */
  const formatLocation = useCallback(() => {
    if (!venueData) return '';
    const parts = [
      venueData.city,
      venueData.state,
      venueData.country,
    ].filter(Boolean);
    return parts.join(', ');
  }, [venueData]);

  /**
   * Sort concerts by date (most recent first)
   */
  const sortedConcerts = useMemo(() => {
    if (!venueData?.concerts) return [];
    return [...venueData.concerts].sort(
      (a, b) => new Date(b.concertDate).getTime() - new Date(a.concertDate).getTime()
    );
  }, [venueData?.concerts]);

  /**
   * Open venue location in Google Maps
   */
  const openInMaps = useCallback(() => {
    if (!venueData) return;

    if (venueData.latitude && venueData.longitude) {
      // Open in Google Maps with coordinates
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${venueData.latitude},${venueData.longitude}`,
        '_blank'
      );
    } else {
      // Search by venue name and location
      const query = encodeURIComponent(`${venueData.name} ${formatLocation()}`);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        '_blank'
      );
    }
  }, [venueData, formatLocation]);

  // Loading state
  if (isLoading || !venueData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" className="text-purple-600" />
          <p className="mt-4 text-gray-600">Loading venue...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Error Loading Venue"
          description="There was an error loading this venue. Please try refreshing the page."
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
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Venues
      </Button>

      {/* Venue Header */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Venue Icon */}
            <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white">
              <svg
                className="h-12 w-12"
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

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {venueData.name}
              </h1>

              {/* Location */}
              <div className="space-y-2 mb-4">
                {formatLocation() && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-lg">{formatLocation()}</span>
                  </div>
                )}

                {venueData.capacity && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="h-5 w-5 flex-shrink-0"
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
                    <span>Capacity: {venueData.capacity.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Stats Badge */}
              <Badge variant="info" className="mb-4">
                {venueData.concerts.length}{' '}
                {venueData.concerts.length === 1 ? 'concert' : 'concerts'} attended
              </Badge>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInMaps}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  View on Map
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      {venueData.latitude && venueData.longitude && (
        <DashboardSection title="Location">
          <Card>
            <CardContent>
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="h-16 w-16 text-gray-400 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Map integration coming soon
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {venueData.latitude.toFixed(6)}, {venueData.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      {/* Concerts List */}
      <DashboardSection title="Concerts at This Venue" description={`All shows you attended at ${venueData.name}`}>
        <Card>
          <CardContent>
            {sortedConcerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedConcerts.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Concerts"
                description="No concert data available for this venue."
                icon={
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                }
              />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}
