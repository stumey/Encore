'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserArtists } from '@/lib/api';
import { ArtistCard } from '@/components/artists/artist-card';
import { DashboardPageHeader } from '@/components/layout';
import { TextInput, Spinner, EmptyState } from '@/components/ui';

/**
 * Artists List Page
 *
 * Displays a grid of all artists the user has seen at concerts.
 * Features:
 * - Search/filter artists by name or genre
 * - Sorted by times seen (most seen first)
 * - Click to view artist detail page
 * - Responsive grid layout
 */
export default function ArtistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: artists, isLoading, error } = useUserArtists();

  /**
   * Filter and sort artists using memoization for performance
   * Filters by name and genre, sorts by concert count descending
   */
  const filteredAndSortedArtists = useMemo(() => {
    if (!artists) return [];

    let result = [...artists];

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.artist.name.toLowerCase().includes(query) ||
        item.artist.genres?.some((genre) => genre.toLowerCase().includes(query))
      );
    }

    // Sort by concert count (most seen first)
    result.sort((a, b) => b.concertCount - a.concertCount);

    return result;
  }, [artists, searchQuery]);

  /**
   * Navigate to artist detail page
   */
  const handleArtistClick = useCallback((artistId: string) => {
    router.push(`/artists/${artistId}`);
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
          <p className="mt-4 text-gray-600">Loading artists...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Error Loading Artists"
          description="There was an error loading your artists. Please try refreshing the page."
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
        title="My Artists"
        description={
          artists && artists.length > 0
            ? `${artists.length} ${artists.length === 1 ? 'artist' : 'artists'} in your collection`
            : 'Discover and track your favorite artists'
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <TextInput
          type="search"
          placeholder="Search artists by name or genre..."
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
        />
      </div>

      {/* Empty State - No Artists */}
      {filteredAndSortedArtists.length === 0 && !searchQuery && (
        <EmptyState
          title="No Artists Yet"
          description="You haven't attended any concerts yet. Start adding concerts to see your artists here!"
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
        />
      )}

      {/* Empty State - No Search Results */}
      {filteredAndSortedArtists.length === 0 && searchQuery && (
        <EmptyState
          title="No Artists Found"
          description={`No artists match "${searchQuery}". Try a different search term.`}
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      )}

      {/* Artists Grid */}
      {filteredAndSortedArtists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedArtists.map((artistData) => (
            <ArtistCard
              key={artistData.artist.id}
              artist={artistData}
              onClick={() => handleArtistClick(artistData.artist.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
