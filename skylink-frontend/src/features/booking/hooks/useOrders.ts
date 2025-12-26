import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/axios';
import type { BookingDetails } from '../types';
import { searchOrders, type OrderSearchResult } from '../api/order';

export const useOrders = (userId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['orders', userId],
    // 后端 orders 为分页结构 { total, data: [] }
    // 统一复用 searchOrders 的兼容解包逻辑，避免把分页对象当数组使用。
    queryFn: () => searchOrders({ userId }),
    enabled: enabled && !!userId,
  });
};

export const useOrder = (orderId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () =>
      request<OrderSearchResult>({ method: 'GET', url: `/api/v1/orders/${encodeURIComponent(String(orderId))}` }),
    enabled: enabled && !!orderId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (details: BookingDetails) =>
      request<OrderSearchResult>({ method: 'POST', url: '/api/v1/orders', data: details }),
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
