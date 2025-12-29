import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
}

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await apiClient.get<User>('/user');
      return data;
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateUserParams) => {
      const { data } = await apiClient.patch<User>('/user', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
