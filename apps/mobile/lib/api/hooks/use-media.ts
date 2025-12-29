import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface Media {
  id: string;
  concertId: string;
  userId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  aiAnalysis?: {
    description?: string;
    tags?: string[];
    colors?: string[];
    objects?: string[];
  };
  createdAt: string;
  updatedAt: string;
  concert?: {
    id: string;
    date: string;
    artist?: {
      name: string;
    };
    venue?: {
      name: string;
    };
  };
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  mediaId: string;
}

export interface CreateMediaParams {
  concertId: string;
  type: 'image' | 'video';
  caption?: string;
  analyzeWithAI?: boolean;
}

export interface MediaResponse {
  media: Media[];
  total: number;
  page: number;
  limit: number;
}

export const useMedia = (params?: {
  concertId?: string;
  limit?: number;
  page?: number;
  type?: 'image' | 'video';
}) => {
  return useQuery({
    queryKey: ['media', params],
    queryFn: async () => {
      const { data } = await apiClient.get<MediaResponse>('/media', { params });
      return data;
    },
  });
};

export const useInfiniteMedia = (params?: {
  concertId?: string;
  limit?: number;
  type?: 'image' | 'video';
}) => {
  return useInfiniteQuery({
    queryKey: ['media', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<MediaResponse>('/media', {
        params: { ...params, page: pageParam },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.media.length === (params?.limit || 20);
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useMediaItem = (id: string) => {
  return useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Media>(`/media/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useGetUploadUrl = () => {
  return useMutation({
    mutationFn: async (params: CreateMediaParams) => {
      const { data } = await apiClient.post<UploadUrlResponse>('/media/upload-url', params);
      return data;
    },
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uploadUrl,
      file
    }: {
      uploadUrl: string;
      file: Blob;
    }) => {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
};

export const useUpdateMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string; caption?: string }) => {
      const { data } = await apiClient.patch<Media>(`/media/${id}`, params);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['media', data.id] });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
};
