'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserArtists } from '@/lib/api/hooks/use-user';
import { ArtistCard } from '@/components/artists/artist-card';
import { TextInput } from '@/components/ui/text-input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Artists List Page
 *
 * Displays a grid of all artists the user has seen at concerts.
 * Features:
 * - Search/filter artists by name
 * - Sorted by times seen (most seen first)
 * - Click to view artist detail page
 */
export default function ArtistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: artists, isLoading, error } = useUserArtists();

  // Filter and sort artists
  const filteredAndSortedArtists = useMemo(() => {
    if (!artists) return [];

    let result = [...artists];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.artist.name.toLowerCase().includes(query) ||
        item.artist.genres.some((genre) => genre.toLowerCase().includes(query))
      );
    }

    // Sort by concert count (most seen first)
    result.sort((a, b) => b.concertCount - a.concertCount);

    return result;
  }, [artists, searchQuery]);

  const handleArtistClick = (artistId: string) => {
    router.push(`/artists/${artistId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="Error Loading Artists"
            description="There was an error loading your artists. Please try again later."
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Artists</h1>
          <p className="text-gray-600">
            {artists ? `${artists.length} ${artists.length === 1 ? 'artist' : 'artists'}` : 'Loading...'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <TextInput
            type="search"
            placeholder="Search artists by name or genre..."
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
        {!isLoading && filteredAndSortedArtists.length === 0 && !searchQuery && (
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

        {/* No Search Results */}
        {!isLoading && filteredAndSortedArtists.length === 0 && searchQuery && (
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
        {!isLoading && filteredAndSortedArtists.length > 0 && (
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
    </div>
  );
}
