'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Venue,
  VenueWithConcerts,
  ApiResponse,
} from '@encore/shared';

const VENUE_KEYS = {
  all: ['venues'] as const,
  searches: () => [...VENUE_KEYS.all, 'search'] as const,
  search: (query: string) => [...VENUE_KEYS.searches(), query] as const,
  details: () => [...VENUE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VENUE_KEYS.details(), id] as const,
};

/**
 * Search for venues
 * GET /venues/search?q=query
 */
export function useVenues(search: string = '') {
  return useQuery({
    queryKey: VENUE_KEYS.search(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('q', search);
      }

      const response = await apiClient.get<ApiResponse<Venue[]>>(
        `/venues/search?${params.toString()}`
      );
      return response.data;
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
