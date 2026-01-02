'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  MediaWithUrls,
  ApiResponse,
  PaginatedResponse,
  MediaType,
} from '@encore/shared';
import type { CreateMediaInput } from '@encore/shared';

interface MediaFilters {
  concertId?: string;
  mediaType?: MediaType;
}

interface UploadUrlResponse {
  uploadUrl: string;
  storagePath: string;
}

const MEDIA_KEYS = {
  all: ['media'] as const,
  lists: () => [...MEDIA_KEYS.all, 'list'] as const,
  list: (page: number, limit: number, filters?: MediaFilters) =>
    [...MEDIA_KEYS.lists(), { page, limit, filters }] as const,
  details: () => [...MEDIA_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MEDIA_KEYS.details(), id] as const,
};

/**
 * Get single media item with server-driven polling during analysis
 */
export function useMediaItem(id: string | null) {
  return useQuery({
    queryKey: MEDIA_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<ApiResponse<MediaWithUrls>>(`/media/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.retryAfter || false;
    },
  });
}

/**
 * Get paginated list of media
 * GET /media?page=1&limit=20&concertId=...&mediaType=...
 *
 * Automatically polls when items are being analyzed to get updated metadata
 */
export function useMedia(
  page: number = 1,
  limit: number = 20,
  filters?: MediaFilters
) {
  return useQuery({
    queryKey: MEDIA_KEYS.list(page, limit, filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.concertId) {
        params.append('concertId', filters.concertId);
      }
      if (filters?.mediaType) {
        params.append('mediaType', filters.mediaType);
      }

      const response = await apiClient.get<PaginatedResponse<MediaWithUrls>>(
        `/media?${params.toString()}`
      );
      return response;
    },
    // Poll every 3s while any items are being analyzed (to get updated metadata like takenAt)
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessingItems = data?.data?.some(
        (item) => item.analysisStatus === 'processing'
      );
      return hasProcessingItems ? 3000 : false;
    },
  });
}

/**
 * Get pre-signed upload URL for media
 * POST /media/upload-url
 */
export function useUploadUrl() {
  return useMutation({
    mutationFn: async (data: { contentType: string; filename?: string }) => {
      const response = await apiClient.post<ApiResponse<UploadUrlResponse>>(
        '/media/upload-url',
        data
      );
      return response.data;
    },
  });
}

/**
 * Create media record after upload
 * POST /media
 */
export function useCreateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMediaInput) => {
      const response = await apiClient.post<ApiResponse<MediaWithUrls>>(
        '/media',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate media lists to refetch
      queryClient.invalidateQueries({ queryKey: MEDIA_KEYS.lists() });
    },
  });
}

/**
 * Trigger AI analysis on media
 * POST /media/:id/analyze
 */
export function useAnalyzeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<MediaWithUrls>>(
        `/media/${id}/analyze`
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update cached detail
      queryClient.setQueryData(MEDIA_KEYS.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: MEDIA_KEYS.lists() });
    },
  });
}

/**
 * Assign media to a concert
 * PATCH /media/:id
 */
export function useAssignMediaToConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, concertId }: { mediaId: string; concertId: string | null }) => {
      const response = await apiClient.patch<ApiResponse<MediaWithUrls>>(
        `/media/${mediaId}`,
        { concertId }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update cached detail
      queryClient.setQueryData(MEDIA_KEYS.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: MEDIA_KEYS.lists() });
    },
  });
}

/**
 * Delete media
 * DELETE /media/:id
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/media/${id}`);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: MEDIA_KEYS.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: MEDIA_KEYS.detail(id) });
    },
  });
}
