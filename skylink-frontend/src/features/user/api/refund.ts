import { request } from '../../../lib/axios';
import type { RefundChangeRecord } from '../types';

export async function listRefundChanges(params: {
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
    url: '/api/v1/refund-change/search',
    params: qp,
  });
}

export async function applyRefundChange(body: {
  orderNo: string | number;
  operType: 1 | 2;
  remark?: string;
  newFlightNo?: string;
  newCabinType?: string;
}): Promise<number> {
  const orderNo = String(body.orderNo ?? '').trim();
  if (!orderNo) throw new Error('缺少 orderNo');

  if (body.operType !== 1 && body.operType !== 2) throw new Error('operType 无效');

  if (body.operType === 2) {
    if (!String(body.newFlightNo ?? '').trim() || !String(body.newCabinType ?? '').trim()) {
      throw new Error('改签必须填写 newFlightNo 与 newCabinType');
    }
  }

  return request<number>({
    method: 'POST',
    url: '/api/v1/refund-change/apply',
    data: {
      orderNo: Number(orderNo),
      operType: body.operType,
      remark: body.remark,
      newFlightNo: body.newFlightNo,
      newCabinType: body.newCabinType,
    },
  });
}

export async function revokeRefundChange(recordId: string | number): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/refund-change/${encodeURIComponent(id)}`,
  });
}

export async function updateRefundChange(
  recordId: string | number,
  body: { remark?: string; newFlightNo?: string; newCabinType?: string },
): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/refund-change/${encodeURIComponent(id)}`,
    data: {
      remark: body.remark,
      newFlightNo: body.newFlightNo,
      newCabinType: body.newCabinType,
    },
  });
}
