import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminDashboardMetrics } from '../api/dashboard';
import type { AdminDashboardMetrics } from '../api/dashboard';

export const useAdminDashboardMetrics = (enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: () => getAdminDashboardMetrics(),
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useInvalidateAdminDashboard = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
};
