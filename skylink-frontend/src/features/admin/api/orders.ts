import { request, type PageResult } from '../../../lib/axios';

export interface AdminOrderItem {
  orderNo: number;
  userId?: number | null;
  orderStatus?: number | null;
  ticketNum?: number | null;
  totalAmount?: number | null;
  orderTime?: string | null;
  payTime?: string | null;
  refundTime?: string | null;
  changeTime?: string | null;

  flightNo?: string | null;
  origin?: string | null;
  destination?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;

  passengerName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export async function listAdminOrders(params: {
  page: number;
  size: number;
  orderNo?: string | number;
  userId?: string | number;
  orderStatus?: number;
  flightNo?: string;
}): Promise<PageResult<AdminOrderItem>> {
  const qp: Record<string, string> = {
    page: String(params.page),
    size: String(params.size),
  };
  if (params.orderNo !== undefined && params.orderNo !== null && String(params.orderNo).trim() !== '') qp.orderNo = String(params.orderNo);
  if (params.userId !== undefined && params.userId !== null && String(params.userId).trim() !== '') qp.userId = String(params.userId);
  if (params.orderStatus !== undefined && params.orderStatus !== null) qp.orderStatus = String(params.orderStatus);
  if (params.flightNo !== undefined && params.flightNo !== null && String(params.flightNo).trim() !== '') qp.flightNo = String(params.flightNo).trim();

  return request<PageResult<AdminOrderItem>>({
    method: 'GET',
    url: '/api/v1/admin/orders',
    params: qp,
  });
}

export async function cancelAdminOrder(orderId: string | number): Promise<boolean> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admin/orders/${encodeURIComponent(id)}/cancel`,
  });
}

export async function updateAdminOrderStatus(orderId: string | number, orderStatus: number): Promise<boolean> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');
  if (!Number.isFinite(orderStatus)) throw new Error('orderStatus 无效');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admin/orders/${encodeURIComponent(id)}/status`,
    data: { orderStatus },
  });
}

export async function deleteAdminOrder(orderId: string | number): Promise<boolean> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admin/orders/${encodeURIComponent(id)}`,
  });
}

