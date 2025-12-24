import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCabinConfigs, createCabinConfig, updateCabinConfig, deleteCabinConfig } from '../api/cabinConfigs';
import type { CabinConfigItem, CabinConfigCreateRequest } from '../api/cabinConfigs';

export const useAdminCabinConfigs = (params: {
  page: number;
  size: number;
  modelId?: number;
  cabinType?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'cabinConfigs', params],
    queryFn: () => listCabinConfigs(params),
    enabled,
  });
};

export const useCreateCabinConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CabinConfigCreateRequest) => createCabinConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cabinConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateCabinConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ configId, body }: { configId: number | string; body: Partial<CabinConfigCreateRequest> }) => 
      updateCabinConfig(configId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cabinConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteCabinConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configId: number | string) => deleteCabinConfig(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cabinConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminCabinConfigs = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'cabinConfigs'] });
};
