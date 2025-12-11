'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useConcerts } from '@/lib/api/hooks/use-concerts';
import { VenueCard } from '@/components/venues/venue-card';
import { TextInput } from '@/components/ui/text-input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
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
 * - Click to view venue detail page
 * - Future: Map view
 */
export default function VenuesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all concerts to aggregate venue data
  const { data: concertsData, isLoading, error } = useConcerts(1, 1000);

  // Aggregate venues with concert counts
  const venuesWithCount = useMemo((): VenueWithCount[] => {
    if (!concertsData?.data) return [];

    const venueMap = new Map<string, VenueWithCount>();

    concertsData.data.forEach((concert) => {
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
    });

    return Array.from(venueMap.values());
  }, [concertsData]);

  // Filter and sort venues
  const filteredAndSortedVenues = useMemo(() => {
    let result = [...venuesWithCount];

    // Filter by search query
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

  const handleVenueClick = (venueId: string) => {
    router.push(`/venues/${venueId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="Error Loading Venues"
            description="There was an error loading your venues. Please try again later."
            icon={
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Venues</h1>
          <p className="text-gray-600">
            {venuesWithCount.length > 0
              ? `${venuesWithCount.length} ${venuesWithCount.length === 1 ? 'venue' : 'venues'}`
              : 'Loading...'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <TextInput
            type="search"
            placeholder="Search venues by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAndSortedVenues.length === 0 && !searchQuery && (
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

        {/* No Search Results */}
        {!isLoading && filteredAndSortedVenues.length === 0 && searchQuery && (
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
        {!isLoading && filteredAndSortedVenues.length > 0 && (
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
    </div>
  );
}
