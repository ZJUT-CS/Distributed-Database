import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminConfigs, createAdminConfig, updateAdminConfig, deleteAdminConfig } from '../api/configs';
import type { AdminConfigItem } from '../api/configs';

export const useAdminConfigs = (params: {
  page: number;
  size: number;
  keyword?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'configs', params],
    queryFn: () => listAdminConfigs(params),
    enabled,
  });
};

export const useCreateAdminConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createAdminConfig>[0]) => createAdminConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAdminConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ configId, body }: { configId: string | number; body: Parameters<typeof updateAdminConfig>[1] }) => 
      updateAdminConfig(configId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAdminConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: string | number) => deleteAdminConfig(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminConfigs = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'configs'] });
};
