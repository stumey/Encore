'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Venue,
  VenueWithConcerts,
  ApiResponse,
} from '@encore/shared';

// Extended venue type for Setlist.fm results (before saving to DB)
export interface SetlistFmVenueResult {
  id: string | null;
  setlistFmId: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
}

// Response type that includes source indicator
interface VenueSearchResponse {
  data: (Venue | SetlistFmVenueResult)[];
  source: 'cache' | 'setlistfm' | 'error';
}

const VENUE_KEYS = {
  all: ['venues'] as const,
  searches: () => [...VENUE_KEYS.all, 'search'] as const,
  search: (query: string) => [...VENUE_KEYS.searches(), query] as const,
  details: () => [...VENUE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VENUE_KEYS.details(), id] as const,
};

/**
 * Search for venues (with cache pull-through)
 * GET /venues/search?q=query
 * Returns cached venues from local DB, or Setlist.fm results if no cache
 */
export function useVenues(search: string = '') {
  return useQuery({
    queryKey: VENUE_KEYS.search(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('q', search);
      }

      const response = await apiClient.get<VenueSearchResponse>(
        `/venues/search?${params.toString()}`
      );
      return response;
    },
    enabled: search.length > 0,
  });
}

/**
 * Get venue by ID with concerts
 * GET /venues/:id
 */
export function useVenue(id: string | null) {
  return useQuery({
    queryKey: VENUE_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Venue ID is required');
      const response = await apiClient.get<ApiResponse<VenueWithConcerts>>(
        `/venues/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create or find a venue from Setlist.fm selection
 * POST /venues/from-setlist
 * Used when user selects a venue from Setlist.fm search results
 */
export function useCreateVenueFromSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venue: SetlistFmVenueResult) => {
      const response = await apiClient.post<ApiResponse<Venue>>(
        '/venues/from-setlist',
        {
          setlistFmId: venue.setlistFmId,
          name: venue.name,
          city: venue.city,
          state: venue.state,
          country: venue.country,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate venue searches to include newly cached venue
      queryClient.invalidateQueries({ queryKey: VENUE_KEYS.searches() });
    },
  });
}
