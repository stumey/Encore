'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  ConcertWithDetails,
  ApiResponse,
  PaginatedResponse,
} from '@encore/shared';
import type {
  CreateConcertInput,
  UpdateConcertInput,
} from '@encore/shared';

const CONCERT_KEYS = {
  all: ['concerts'] as const,
  lists: () => [...CONCERT_KEYS.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...CONCERT_KEYS.lists(), { page, limit }] as const,
  details: () => [...CONCERT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CONCERT_KEYS.details(), id] as const,
};

/**
 * Get paginated list of concerts
 * GET /concerts?page=1&limit=20
 */
export function useConcerts(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: CONCERT_KEYS.list(page, limit),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ConcertWithDetails>>(
        `/concerts?page=${page}&limit=${limit}`
      );
      return response;
    },
  });
}

/**
 * Get single concert by ID
 * GET /concerts/:id
 */
export function useConcert(id: string | null) {
  return useQuery({
    queryKey: CONCERT_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Concert ID is required');
      const response = await apiClient.get<ApiResponse<ConcertWithDetails>>(
        `/concerts/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new concert
 * POST /concerts
 */
export function useCreateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConcertInput) => {
      const response = await apiClient.post<ApiResponse<ConcertWithDetails>>(
        '/concerts',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate concert lists to refetch
      queryClient.invalidateQueries({ queryKey: CONCERT_KEYS.lists() });
    },
  });
}

/**
 * Update existing concert
 * PUT /concerts/:id
 */
export function useUpdateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConcertInput;
    }) => {
      const response = await apiClient.put<ApiResponse<ConcertWithDetails>>(
        `/concerts/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: CONCERT_KEYS.lists() });
      // Update cached detail
      queryClient.setQueryData(CONCERT_KEYS.detail(data.id), data);
    },
  });
}

/**
 * Delete concert
 * DELETE /concerts/:id
 */
export function useDeleteConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/concerts/${id}`);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: CONCERT_KEYS.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: CONCERT_KEYS.detail(id) });
    },
  });
}
