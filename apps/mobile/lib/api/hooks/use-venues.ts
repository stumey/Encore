import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface Venue {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  capacity?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    concerts: number;
  };
}

export interface CreateVenueParams {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  capacity?: number;
}

export interface UpdateVenueParams extends Partial<CreateVenueParams> {
  id: string;
}

export const useVenues = (params?: { search?: string; sortBy?: 'name' | 'concerts' }) => {
  return useQuery({
    queryKey: ['venues', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Venue[]>('/venues', { params });
      return data;
    },
  });
};

export const useVenue = (id: string) => {
  return useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Venue>(`/venues/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateVenueParams) => {
      const { data } = await apiClient.post<Venue>('/venues', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateVenueParams) => {
      const { data } = await apiClient.patch<Venue>(`/venues/${id}`, params);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['venue', data.id] });
    },
  });
};

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/venues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};
