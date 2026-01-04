'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  Artist,
  ArtistWithConcerts,
  MediaWithUrls,
  ApiResponse,
} from '@encore/shared';

// Extended artist type for Genius results (before saving to DB)
export interface GeniusArtistResult {
  id: string | null;
  geniusId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

// Response type that includes source indicator
interface ArtistSearchResponse {
  data: (Artist | GeniusArtistResult)[];
  source: 'cache' | 'genius' | 'error';
}

const ARTIST_KEYS = {
  all: ['artists'] as const,
  searches: () => [...ARTIST_KEYS.all, 'search'] as const,
  search: (query: string) => [...ARTIST_KEYS.searches(), query] as const,
  details: () => [...ARTIST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ARTIST_KEYS.details(), id] as const,
  media: (id: string) => [...ARTIST_KEYS.detail(id), 'media'] as const,
};

/**
 * Search for artists (with cache pull-through)
 * GET /artists/search?q=query
 * Returns cached artists from local DB, or Genius results if no cache
 */
export function useArtists(search: string = '') {
  return useQuery({
    queryKey: ARTIST_KEYS.search(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('q', search);
      }

      const response = await apiClient.get<ArtistSearchResponse>(
        `/artists/search?${params.toString()}`
      );
      return response;
    },
    enabled: search.length > 0,
  });
}

/**
 * Create or find an artist from Genius selection
 * POST /artists/from-genius
 * Used when user selects an artist from Genius search results
 */
export function useCreateArtistFromGenius() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artist: GeniusArtistResult) => {
      const response = await apiClient.post<ApiResponse<Artist>>(
        '/artists/from-genius',
        {
          geniusId: artist.geniusId,
          name: artist.name,
          imageUrl: artist.imageUrl,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate artist searches to include newly cached artist
      queryClient.invalidateQueries({ queryKey: ARTIST_KEYS.searches() });
    },
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

// Input for manual artist creation
export interface ManualArtistInput {
  name: string;
}

/**
 * Create an artist manually
 * POST /artists
 * Used when artist doesn't exist in Genius
 */
export function useCreateArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artist: ManualArtistInput) => {
      const response = await apiClient.post<ApiResponse<Artist>>('/artists', artist);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTIST_KEYS.searches() });
    },
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
