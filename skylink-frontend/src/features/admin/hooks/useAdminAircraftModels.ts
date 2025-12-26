import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAircraftModels, listAircraftModelOptions, createAircraftModel, updateAircraftModel, deleteAircraftModel } from '../api/aircraftModels';
import type { AircraftModelItem, AircraftModelOption, AircraftModelCreateRequest } from '../api/aircraftModels';

export const useAdminAircraftModels = (params: {
  page: number;
  size: number;
  keyword?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'aircraftModels', params],
    queryFn: () => listAircraftModels(params),
    enabled,
  });
};

export const useAircraftModelOptions = (limit = 200, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'aircraftModelOptions', limit],
    queryFn: () => listAircraftModelOptions(limit),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateAircraftModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AircraftModelCreateRequest) => createAircraftModel(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModelOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAircraftModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, body }: { modelId: number | string; body: Partial<AircraftModelCreateRequest> }) => 
      updateAircraftModel(modelId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModelOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAircraftModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: number | string) => deleteAircraftModel(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModelOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminAircraftModels = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'aircraftModels'] });
};
