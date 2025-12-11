'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Setlist,
  ApiResponse,
} from '@encore/shared';

const SETLIST_KEYS = {
  all: ['setlists'] as const,
  details: () => [...SETLIST_KEYS.all, 'detail'] as const,
  detail: (concertId: string) => [...SETLIST_KEYS.details(), concertId] as const,
  searches: () => [...SETLIST_KEYS.all, 'search'] as const,
  search: (artistId?: string, date?: string) =>
    [...SETLIST_KEYS.searches(), { artistId, date }] as const,
};

/**
 * Get setlist for a concert
 * GET /setlists/:concertId
 */
export function useSetlist(concertId: string | null) {
  return useQuery({
    queryKey: SETLIST_KEYS.detail(concertId || ''),
    queryFn: async () => {
      if (!concertId) throw new Error('Concert ID is required');
      const response = await apiClient.get<ApiResponse<Setlist>>(
        `/setlists/${concertId}`
      );
      return response.data;
    },
    enabled: !!concertId,
  });
}

/**
 * Search setlists from setlist.fm
 * GET /setlists/search?artistId=...&date=...
 */
export function useSearchSetlists(artistId?: string, date?: string) {
  return useQuery({
    queryKey: SETLIST_KEYS.search(artistId, date),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (artistId) {
        params.append('artistId', artistId);
      }
      if (date) {
        params.append('date', date);
      }

      const response = await apiClient.get<ApiResponse<Setlist[]>>(
        `/setlists/search?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!artistId || !!date,
  });
}
