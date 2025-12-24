import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminFlights, createAdminFlight, updateAdminFlight, deleteAdminFlight } from '../api/flights';
import type { AdminFlightItem, AdminFlightUpsertRequest } from '../api/flights';

export const useAdminFlights = (params: {
  page: number;
  size: number;
  keyword?: string;
  flightNo?: string;
  departureCity?: string;
  arrivalCity?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'flights', params],
    queryFn: () => listAdminFlights(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateAdminFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminFlightUpsertRequest) => createAdminFlight(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAdminFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flightId, body }: { flightId: string | number; body: AdminFlightUpsertRequest }) => 
      updateAdminFlight(flightId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAdminFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flightId: string | number) => deleteAdminFlight(flightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminFlights = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] });
};
