import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminOrders, cancelAdminOrder, updateAdminOrderStatus, deleteAdminOrder, auditAdminOrder } from '../api/orders';
import type { AdminOrderItem } from '../api/orders';

export const useAdminOrders = (params: {
  page: number;
  size: number;
  orderNo?: string | number;
  userId?: string | number;
  orderStatus?: number;
  flightNo?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => listAdminOrders(params),
    enabled,
  });
};

export const useCancelAdminOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => cancelAdminOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAdminOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, orderStatus }: { orderId: string | number; orderStatus: number }) => 
      updateAdminOrderStatus(orderId, orderStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAdminOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => deleteAdminOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useAuditAdminOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, pass }: { orderId: string | number; pass: boolean }) => 
      auditAdminOrder(orderId, pass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminOrders = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
};
