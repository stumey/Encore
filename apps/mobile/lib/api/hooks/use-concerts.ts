import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface Concert {
  id: string;
  artistId: string;
  venueId: string;
  date: string;
  title?: string;
  notes?: string;
  setlist?: string[];
  rating?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  artist?: {
    id: string;
    name: string;
    genre?: string;
  };
  venue?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  _count?: {
    media: number;
  };
}

export interface CreateConcertParams {
  artistId: string;
  venueId: string;
  date: string;
  title?: string;
  notes?: string;
  setlist?: string[];
  rating?: number;
}

export interface UpdateConcertParams extends Partial<CreateConcertParams> {
  id: string;
}

export interface ConcertsResponse {
  concerts: Concert[];
  total: number;
  page: number;
  limit: number;
}

export const useConcerts = (params?: { limit?: number; page?: number; search?: string }) => {
  return useQuery({
    queryKey: ['concerts', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ConcertsResponse>('/concerts', { params });
      return data;
    },
  });
};

export const useInfiniteConcerts = (params?: { limit?: number; search?: string }) => {
  return useInfiniteQuery({
    queryKey: ['concerts', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<ConcertsResponse>('/concerts', {
        params: { ...params, page: pageParam },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.concerts.length === (params?.limit || 20);
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useConcert = (id: string) => {
  return useQuery({
    queryKey: ['concert', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Concert>(`/concerts/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateConcertParams) => {
      const { data } = await apiClient.post<Concert>('/concerts', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  });
};

export const useUpdateConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateConcertParams) => {
      const { data } = await apiClient.patch<Concert>(`/concerts/${id}`, params);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
      queryClient.invalidateQueries({ queryKey: ['concert', data.id] });
    },
  });
};

export const useDeleteConcert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/concerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  });
};

export const useConcertStats = () => {
  return useQuery({
    queryKey: ['concert-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/concerts/stats');
      return data;
    },
  });
};
