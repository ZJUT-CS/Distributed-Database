import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRefundChangeRequests, approveRefundChangeRequest, rejectRefundChangeRequest } from '../api/refundChangeRequests';
import type { RefundChangeRecord } from '../../refund/types';

export const useAdminRefundChanges = (params: {
  userId?: string | number;
  orderNo?: string | number;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'refundChanges', params],
    queryFn: () => listRefundChangeRequests(params),
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 7 * 60 * 1000, // 7 minutes
  });
};

export const useApproveRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string | number) => approveRefundChangeRequest(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useRejectRefundChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string | number) => rejectRefundChangeRequest(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['refundChanges'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useInvalidateAdminRefundChanges = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'refundChanges'] });
};
