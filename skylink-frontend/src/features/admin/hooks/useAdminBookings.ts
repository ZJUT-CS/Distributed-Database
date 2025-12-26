import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminOrders, cancelAdminOrder, updateAdminOrderStatus, deleteAdminOrder, auditAdminOrder } from '../api/orders';
import type { AdminOrderItem } from '../api/orders';

export const useAdminBookings = (params: {
  page: number;
  size: number;
  orderNo?: string | number;
  userId?: string | number;
  orderStatus?: number;
  flightNo?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'bookings', params],
    queryFn: () => listAdminOrders(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
  });
};

export const useCancelAdminBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => cancelAdminOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useUpdateAdminBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, orderStatus }: { orderId: string | number; orderStatus: number }) => 
      updateAdminOrderStatus(orderId, orderStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAdminBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string | number) => deleteAdminOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useAuditAdminBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, pass }: { orderId: string | number; pass: boolean }) => 
      auditAdminOrder(orderId, pass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminBookings = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
};
