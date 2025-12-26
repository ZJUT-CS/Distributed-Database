import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/axios';
import type { Flight, SearchParams } from '../types';

export const useFlights = (params: SearchParams, enabled = true) => {
  return useQuery({
    queryKey: ['flights', params],
    queryFn: () => request<Flight[]>({ method: 'GET', url: '/api/v1/flights', params }),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
};

export const useFlight = (id: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['flight', id],
    queryFn: () => request<Flight>({ method: 'GET', url: `/api/v1/flights/${id}` }),
    enabled: enabled && !!id,
  });
};

export const useInvalidateFlights = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['flights'] });
};
