import { request } from '../../../lib/axios';
import type { RefundChangeRecord } from '@/features/user/components/refund/types';

export async function listRefundChangeRequests(params: {
  userId?: string | number;
  orderNo?: string | number;
}): Promise<RefundChangeRecord[]> {
  const qp: Record<string, string> = {};
  if (params.userId !== undefined && params.userId !== null && String(params.userId).trim() !== '') {
    qp.userId = String(params.userId);
  }
  if (params.orderNo !== undefined && params.orderNo !== null && String(params.orderNo).trim() !== '') {
    qp.orderNo = String(params.orderNo);
  }

  return request<RefundChangeRecord[]>({
    method: 'GET',
    url: '/api/v1/refund-change-requests',
    params: qp,
  });
}

export async function approveRefundChangeRequest(recordId: string | number): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'POST',
    url: `/api/v1/refund-change-requests/${encodeURIComponent(id)}/approvals`,
  });
}

export async function rejectRefundChangeRequest(recordId: string | number): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'POST',
    url: `/api/v1/refund-change-requests/${encodeURIComponent(id)}/rejections`,
  });
}
