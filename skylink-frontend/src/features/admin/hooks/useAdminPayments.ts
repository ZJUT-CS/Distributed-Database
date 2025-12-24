import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPaymentsPage, createPayment, confirmPayment } from '../api/payments';
import type { PaymentItem, PaymentSearchPageParams, CreatePaymentRequest, ConfirmPaymentRequest } from '../api/payments';

export const useAdminPayments = (params: PaymentSearchPageParams, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: () => listPaymentsPage(params),
    enabled,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePaymentRequest) => createPayment(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ConfirmPaymentRequest) => confirmPayment(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useInvalidateAdminPayments = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
};
