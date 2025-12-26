import { request } from '@/shared/api/axios';
import type { RefundChangeRecord } from '@/features/user/components/refund/types';

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
    url: '/api/v1/refund-change-requests',
    params: qp,
  });
}

export async function applyRefundChange(body: {
  orderNo: string | number;
  operType: 1 | 2;
  remark?: string;
  newFlightId?: string | number;
  newFlightIds?: Array<string | number>;
  newCabinType?: string;
}): Promise<number> {
  const orderNoStr = String(body.orderNo ?? '').trim();
  if (!orderNoStr) throw new Error('缺少 orderNo');

  if (body.operType !== 1 && body.operType !== 2) throw new Error('operType 无效');

  if (body.operType === 2) {
    const newFlightIds = Array.isArray(body.newFlightIds)
      ? body.newFlightIds.map((x) => String(x ?? '').trim()).filter(Boolean)
      : [];
    const newFlightId = String(body.newFlightId ?? '').trim();
    if (newFlightIds.length === 0 && !newFlightId) throw new Error('改签必须填写 newFlightId/newFlightIds');
    if (!String(body.newCabinType ?? '').trim()) throw new Error('改签必须填写 newCabinType');
  }

  // 使用字符串形式发送 orderNo，后端 Jackson 会正确解析为 Long
  // 避免 JavaScript Number 类型对雪花ID的精度丢失
  return request<number>({
    method: 'POST',
    url: '/api/v1/refund-change-requests',
    data: {
      orderNo: orderNoStr,  // 保持字符串形式
      operType: body.operType,
      remark: body.remark,
      newFlightId: body.operType === 2 ? String(body.newFlightId ?? '').trim() || undefined : undefined,
      newFlightIds: body.operType === 2 && Array.isArray(body.newFlightIds)
        ? body.newFlightIds.map((x) => String(x ?? '').trim()).filter(Boolean)
        : undefined,
      newCabinType: body.newCabinType,
    },
  });
}

export async function revokeRefundChange(recordId: string | number): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/refund-change-requests/${encodeURIComponent(id)}`,
  });
}

export async function updateRefundChange(
  recordId: string | number,
  body: { remark?: string; newFlightId?: string | number; newCabinType?: string },
): Promise<boolean> {
  const id = String(recordId ?? '').trim();
  if (!id) throw new Error('缺少 recordId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/refund-change-requests/${encodeURIComponent(id)}`,
    data: {
      remark: body.remark,
      newFlightId: body.newFlightId != null ? String(body.newFlightId).trim() : undefined,
      newCabinType: body.newCabinType,
    },
  });
}
