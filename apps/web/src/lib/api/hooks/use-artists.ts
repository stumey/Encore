'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Artist,
  ArtistWithConcerts,
  MediaWithUrls,
  ApiResponse,
} from '@encore/shared';

const ARTIST_KEYS = {
  all: ['artists'] as const,
  searches: () => [...ARTIST_KEYS.all, 'search'] as const,
  search: (query: string) => [...ARTIST_KEYS.searches(), query] as const,
  details: () => [...ARTIST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ARTIST_KEYS.details(), id] as const,
  media: (id: string) => [...ARTIST_KEYS.detail(id), 'media'] as const,
};

/**
 * Search for artists
 * GET /artists/search?q=query
 */
export function useArtists(search: string = '') {
  return useQuery({
    queryKey: ARTIST_KEYS.search(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('q', search);
      }

      const response = await apiClient.get<ApiResponse<Artist[]>>(
        `/artists/search?${params.toString()}`
      );
      return response.data;
    },
    enabled: search.length > 0,
  });
}

/**
 * Get artist by ID with concerts
 * GET /artists/:id
 */
export function useArtist(id: string | null) {
  return useQuery({
    queryKey: ARTIST_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Artist ID is required');
      const response = await apiClient.get<ApiResponse<ArtistWithConcerts>>(
        `/artists/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get media for an artist
 * GET /artists/:id/media
 */
export function useArtistMedia(id: string | null) {
  return useQuery({
    queryKey: ARTIST_KEYS.media(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Artist ID is required');
      const response = await apiClient.get<ApiResponse<MediaWithUrls[]>>(
        `/artists/${id}/media`
      );
      return response.data;
    },
    enabled: !!id,
  });
}
