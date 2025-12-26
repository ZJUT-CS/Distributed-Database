import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRoutes, listRouteOptions, createRoute, updateRoute, deleteRoute } from '../api/routes';
import type { RouteItem, RouteOption, RouteCreateRequest } from '../api/routes';

export const useAdminRoutes = (params: {
  page: number;
  size: number;
  keyword?: string;
  departureCity?: string;
  arrivalCity?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'routes', params],
    queryFn: () => listRoutes(params),
    enabled,
  });
};

export const useRouteOptions = (limit = 200, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'routeOptions', limit],
    queryFn: () => listRouteOptions(limit),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RouteCreateRequest) => createRoute(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'routeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, body }: { routeId: number | string; body: Partial<RouteCreateRequest> }) => 
      updateRoute(routeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'routeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: number | string) => deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'routeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminRoutes = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] });
};
