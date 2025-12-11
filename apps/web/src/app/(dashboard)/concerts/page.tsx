'use client';

import { useState, useMemo } from 'react';
import { useConcerts } from '@/lib/api/hooks/use-concerts';
import { ConcertCard } from '@/components/concerts/concert-card';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { EmptyState, EmptyStateIcon } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';

/**
 * Concerts List Page
 *
 * Displays a paginated, searchable grid of user's concerts
 * with filtering by artist, venue, and date range.
 */
export default function ConcertsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const limit = 12;
  const { data, isLoading, error } = useConcerts(page, limit);

  // Client-side filtering for search and date
  const filteredConcerts = useMemo(() => {
    if (!data?.data) return [];

    let concerts = data.data;

    // Filter by search query (artist or venue)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      concerts = concerts.filter(concert => {
        const artistMatch = concert.artists.some(a =>
          a.artist.name.toLowerCase().includes(query)
        );
        const venueMatch = concert.venue?.name.toLowerCase().includes(query);
        return artistMatch || venueMatch;
      });
    }

    // Filter by date
    if (dateFilter) {
      concerts = concerts.filter(concert => {
        const concertDate = new Date(concert.concertDate).toISOString().split('T')[0];
        return concertDate === dateFilter;
      });
    }

    return concerts;
  }, [data?.data, searchQuery, dateFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  const hasActiveFilters = searchQuery || dateFilter;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading concerts: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Concerts</h1>
              <p className="mt-2 text-sm text-gray-600">
                {data?.pagination.total || 0} total concerts
              </p>
            </div>
            <Button
              onClick={() => router.push('/concerts/new')}
              variant="primary"
              size="lg"
            >
              <svg
                className="h-5 w-5"
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

          {/* Search and Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TextInput
                placeholder="Search by artist or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <TextInput
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                fullWidth
                placeholder="Filter by date"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredConcerts.length} of {data?.pagination.total || 0} concerts
              </span>
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                size="sm"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredConcerts.length === 0 ? (
          <EmptyState
            icon={<EmptyStateIcon />}
            title={hasActiveFilters ? 'No concerts found' : 'No concerts yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters'
                : "You haven't added any concerts yet. Start building your concert history!"
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Clear filters',
                    onClick: handleClearFilters,
                  }
                : {
                    label: 'Add Your First Concert',
                    onClick: () => router.push('/concerts/new'),
                  }
            }
          />
        ) : (
          <>
            {/* Concert Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConcerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>

            {/* Pagination */}
            {!hasActiveFilters && data && data.pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-gray-700">
                    Page {page} of {data.pagination.pages}
                  </span>
                </div>
                <Button
                  onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
