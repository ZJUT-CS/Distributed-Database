import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import type { Order, BookingDetails } from '../types';

export const useOrders = (userId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => request<Order[]>({ method: 'GET', url: '/api/v1/orders', params: { userId } }),
    enabled: enabled && !!userId,
  });
};

export const useOrder = (orderId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => request<Order>({ method: 'GET', url: `/api/v1/orders/${orderId}` }),
    enabled: enabled && !!orderId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (details: BookingDetails) => 
      request<Order>({ method: 'POST', url: '/api/v1/orders', data: details }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number | string) => 
      request({ method: 'POST', url: `/api/v1/orders/${orderId}/cancellation` }),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
};

export const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] });
};
