import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/axios';
import { applyRefundChange } from '@/features/user/api/refund';
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
    mutationFn: (data: {
      orderNo: string | number;
      operType: 1 | 2;
      remark?: string;
      newFlightId?: string | number;
      newFlightIds?: Array<string | number>;
      newCabinType?: string;
    }) => applyRefundChange(data),
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

export const useApproveRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number | string) =>
      request({ method: 'POST', url: `/api/v1/refund-change-requests/${recordId}/approvals` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useRejectRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number | string) =>
      request({ method: 'POST', url: `/api/v1/refund-change-requests/${recordId}/rejections` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
