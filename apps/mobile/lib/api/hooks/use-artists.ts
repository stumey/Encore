import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  spotifyId?: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    concerts: number;
  };
}

export interface CreateArtistParams {
  name: string;
  genre?: string;
  spotifyId?: string;
  imageUrl?: string;
}

export interface UpdateArtistParams extends Partial<CreateArtistParams> {
  id: string;
}

export const useArtists = (params?: { search?: string; sortBy?: 'name' | 'concerts' }) => {
  return useQuery({
    queryKey: ['artists', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Artist[]>('/artists', { params });
      return data;
    },
  });
};

export const useArtist = (id: string) => {
  return useQuery({
    queryKey: ['artist', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Artist>(`/artists/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateArtistParams) => {
      const { data } = await apiClient.post<Artist>('/artists', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
};

export const useUpdateArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateArtistParams) => {
      const { data } = await apiClient.patch<Artist>(`/artists/${id}`, params);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['artist', data.id] });
    },
  });
};

export const useDeleteArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/artists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
};
