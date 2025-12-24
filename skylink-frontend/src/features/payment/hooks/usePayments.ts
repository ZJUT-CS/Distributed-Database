import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/axios';
import type { Payment } from '../types';
import { listPaymentsPage, type PaymentSearchPageParams, type PaymentItem } from '@/features/admin/api/payments';

export const usePayments = (params?: { userId?: number | string; orderId?: number | string; page?: number; size?: number }, enabled = true) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => request<Payment[]>({ method: 'GET', url: '/api/v1/payments', params }),
    enabled,
  });
};

export const useAdminPayments = (params: PaymentSearchPageParams, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: () => listPaymentsPage(params),
    enabled,
  });
};

export const usePayment = (paymentId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => request<Payment>({ method: 'GET', url: `/api/v1/payments/${paymentId}` }),
    enabled: enabled && !!paymentId,
  });
};

export const useCreatePaymentConfirmToken = () => {
  return useMutation({
    mutationFn: (data: { orderId: number | string; amount: number }) => 
      request<{ token: string }>({ method: 'POST', url: '/api/v1/payments/confirmation-tokens', data }),
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { token: string; paymentMethod: string }) => 
      request<Payment>({ method: 'POST', url: '/api/v1/payments/confirmations', data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useInvalidatePayments = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['payments'] });
};

export const useAdminCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: string; paymentMethod: string }) => 
      request<PaymentItem>({ method: 'POST', url: '/api/v1/payments', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useAdminConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { token: string; paymentMethod: string }) => 
      request<PaymentItem>({ method: 'POST', url: '/api/v1/payments/confirmations', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
