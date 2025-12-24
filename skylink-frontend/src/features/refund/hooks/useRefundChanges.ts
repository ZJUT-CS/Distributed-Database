import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import type { RefundChange } from '../types';

export const useRefundChanges = (userId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['refundChanges', userId],
    queryFn: () => request<RefundChange[]>({ method: 'GET', url: '/api/v1/refund-change-requests', params: { userId } }),
    enabled: enabled && !!userId,
  });
};

export const useRefundChange = (id: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['refundChange', id],
    queryFn: () => request<RefundChange>({ method: 'GET', url: `/api/v1/refund-change-requests/${id}` }),
    enabled: enabled && !!id,
  });
};

export const useApplyRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: number | string; operType: number; reason?: string }) => 
      request<RefundChange>({ method: 'POST', url: '/api/v1/refund-change-requests', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useRevokeRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => 
      request({ method: 'DELETE', url: `/api/v1/refund-change-requests/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
    },
  });
};

export const useUpdateRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<RefundChange> }) => 
      request<RefundChange>({ method: 'PUT', url: `/api/v1/refund-change-requests/${id}`, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
    },
  });
};

export const useInvalidateRefundChanges = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
};
