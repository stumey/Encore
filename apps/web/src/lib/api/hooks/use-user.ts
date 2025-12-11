'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  UserProfile,
  UserStats,
  ArtistWithCount,
  ApiResponse,
} from '@encore/shared';
import type { UpdateProfileInput } from '@encore/shared';

const USER_KEYS = {
  all: ['users'] as const,
  currentUser: () => [...USER_KEYS.all, 'me'] as const,
  stats: () => [...USER_KEYS.all, 'me', 'stats'] as const,
  artists: () => [...USER_KEYS.all, 'me', 'artists'] as const,
};

/**
 * Get current user profile
 * GET /users/me
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: USER_KEYS.currentUser(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
      return response.data;
    },
  });
}

/**
 * Update current user profile
 * PUT /users/me
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await apiClient.put<ApiResponse<UserProfile>>(
        '/users/me',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update cached user data
      queryClient.setQueryData(USER_KEYS.currentUser(), data);
    },
  });
}

/**
 * Get current user statistics
 * GET /users/me/stats
 */
export function useUserStats() {
  return useQuery({
    queryKey: USER_KEYS.stats(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserStats>>(
        '/users/me/stats'
      );
      return response.data;
    },
  });
}

/**
 * Get current user's artists with concert counts
 * GET /users/me/artists
 */
export function useUserArtists() {
  return useQuery({
    queryKey: USER_KEYS.artists(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ArtistWithCount[]>>(
        '/users/me/artists'
      );
      return response.data;
    },
  });
}
