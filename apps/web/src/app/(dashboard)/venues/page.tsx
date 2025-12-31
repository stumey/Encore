'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConcerts } from '@/lib/api';
import { VenueCard } from '@/components/venues/venue-card';
import { DashboardPageHeader } from '@/components/layout';
import { TextInput, Spinner, EmptyState } from '@/components/ui';
import type { Venue } from '@encore/shared';

interface VenueWithCount extends Venue {
  concertCount: number;
}

/**
 * Venues List Page
 *
 * Displays a grid of all venues where the user has attended concerts.
 * Features:
 * - Search/filter venues by name or location
 * - Shows concert count for each venue
 * - Sorted by concert count (most attended first)
 * - Click to view venue detail page
 * - Future: Map view
 */
export default function VenuesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all concerts to aggregate venue data
  const { data: concertsData, isLoading, error } = useConcerts(1, 1000);

  /**
   * Aggregate venues with concert counts using Map for O(1) lookups
   */
  const venuesWithCount = useMemo((): VenueWithCount[] => {
    if (!concertsData?.data) return [];

    const venueMap = new Map<string, VenueWithCount>();

    // Use for...of for better performance than forEach
    for (const concert of concertsData.data) {
      if (concert.venue) {
        const existing = venueMap.get(concert.venue.id);
        if (existing) {
          existing.concertCount += 1;
        } else {
          venueMap.set(concert.venue.id, {
            ...concert.venue,
            concertCount: 1,
          });
        }
      }
    }

    return Array.from(venueMap.values());
  }, [concertsData?.data]);

  /**
   * Filter and sort venues using memoization for performance
   */
  const filteredAndSortedVenues = useMemo(() => {
    let result = [...venuesWithCount];

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((venue) => {
        const searchableText = [
          venue.name,
          venue.city,
          venue.state,
          venue.country,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Sort by concert count (most concerts first)
    result.sort((a, b) => b.concertCount - a.concertCount);

    return result;
  }, [venuesWithCount, searchQuery]);

  /**
   * Navigate to venue detail page
   */
  const handleVenueClick = useCallback((venueId: string) => {
    router.push(`/venues/${venueId}`);
  }, [router]);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" className="text-primary-600" />
          <p className="mt-4 text-gray-600">Loading venues...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Error Loading Venues"
          description="There was an error loading your venues. Please try refreshing the page."
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
        title="My Venues"
        description={
          venuesWithCount.length > 0
            ? `${venuesWithCount.length} ${venuesWithCount.length === 1 ? 'venue' : 'venues'} in your collection`
            : 'Explore the venues where you have seen concerts'
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <TextInput
          type="search"
          placeholder="Search venues by name or location..."
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
        />
      </div>

      {/* Empty State - No Venues */}
      {filteredAndSortedVenues.length === 0 && !searchQuery && (
        <EmptyState
          title="No Venues Yet"
          description="You haven't attended any concerts yet. Start adding concerts to see your venues here!"
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      )}

      {/* Empty State - No Search Results */}
      {filteredAndSortedVenues.length === 0 && searchQuery && (
        <EmptyState
          title="No Venues Found"
          description={`No venues match "${searchQuery}". Try a different search term.`}
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      )}

      {/* Venues Grid */}
      {filteredAndSortedVenues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onClick={() => handleVenueClick(venue.id)}
            />
          ))}
        </div>
      )}

      {/* Future Map View Placeholder */}
      {/* TODO: Add map view toggle and implementation */}
    </div>
  );
}
