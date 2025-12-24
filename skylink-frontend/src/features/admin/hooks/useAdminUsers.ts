import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword, deleteAdminUser } from '../api/users';
import type { AdminUserItem } from '../api/users';

export const useAdminUsers = (params: {
  page: number;
  size: number;
  keyword?: string;
  status?: number;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => listAdminUsers(params),
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
  });
};

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createAdminUser>[0]) => createAdminUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string | number; body: Parameters<typeof updateAdminUser>[1] }) => 
      updateAdminUser(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useResetAdminUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string | number; password: string }) => 
      resetAdminUserPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string | number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminUsers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
};
