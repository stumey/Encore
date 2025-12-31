'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Artist,
  ApiResponse,
  ConcertWithDetails,
  VenueLineupResponse,
} from '@encore/shared';

// Re-export for component imports
export type { LineupArtist, VenueLineupResponse } from '@encore/shared';

const LINEUP_KEYS = {
  all: ['lineup'] as const,
  venue: (venueId: string, date: string) =>
    [...LINEUP_KEYS.all, venueId, date] as const,
};

/**
 * Get lineup suggestions for a venue + date combo
 * Automatically fetches when both venueId and date are provided
 */
export function useLineupSuggestions(
  setlistFmVenueId: string | null,
  date: string | null // YYYY-MM-DD format from date input
) {
  return useQuery({
    queryKey: LINEUP_KEYS.venue(setlistFmVenueId || '', date || ''),
    queryFn: async () => {
      if (!setlistFmVenueId || !date) return null;

      // Convert YYYY-MM-DD to dd-MM-yyyy for Setlist.fm
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const response = await apiClient.get<ApiResponse<VenueLineupResponse>>(
        `/setlists/venue-lineup?venueId=${setlistFmVenueId}&date=${formattedDate}`
      );
      return response.data;
    },
    enabled: !!setlistFmVenueId && !!date,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on failure - graceful degradation
  });
}

/**
 * Batch create artists from Setlist.fm and add them to a concert
 */
export function useAddSuggestedArtists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      concertId,
      artists,
    }: {
      concertId: string;
      artists: Array<{ mbid: string; name: string; isHeadliner: boolean }>;
    }) => {
      // 1. Batch create/find artists by MBID
      const batchResponse = await apiClient.post<ApiResponse<Artist[]>>(
        '/artists/batch-from-setlist',
        { artists: artists.map((a) => ({ mbid: a.mbid, name: a.name })) }
      );

      // 2. Add artists to the concert
      const addResponse = await apiClient.post<ApiResponse<ConcertWithDetails>>(
        `/concerts/${concertId}/artists`,
        {
          artists: batchResponse.data.map((artist, i) => ({
            artistId: artist.id,
            isHeadliner: artists[i].isHeadliner,
          })),
        }
      );

      return addResponse.data;
    },
    onSuccess: () => {
      // Invalidate concert queries to refetch with new artists
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  });
}
