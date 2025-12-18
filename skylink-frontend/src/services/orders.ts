import { request } from './api';

export interface CreateOrderResult {
  orderNo: number;
  flightNo?: string | null;
  passengerName?: string | null;
  orderStatus?: number | null;
  totalAmount?: number | null;
  orderTime?: string | null;
  payTime?: string | null;
  refundTime?: string | null;
  changeTime?: string | null;
}

export async function createOrder(body: {
  userId: string | number;
  flightNo: string;
  cabinType: string;
  ticketNum: number;
}): Promise<CreateOrderResult> {
  const userId = String(body.userId ?? '').trim();
  if (!userId) throw new Error('缺少 userId');
  const flightNo = String(body.flightNo ?? '').trim();
  if (!flightNo) throw new Error('缺少 flightNo');
  const cabinType = String(body.cabinType ?? '').trim();
  if (!cabinType) throw new Error('缺少 cabinType');
  if (!Number.isFinite(body.ticketNum) || body.ticketNum <= 0) throw new Error('ticketNum 无效');

  return request<CreateOrderResult>({
    method: 'POST',
    url: '/api/v1/orders/create',
    data: {
      userId: Number(userId),
      flightNo,
      cabinType,
      ticketNum: Math.floor(body.ticketNum),
    },
  });
}

export async function cancelOrder(orderId: string | number): Promise<void> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');

  await request({
    method: 'POST',
    url: `/api/v1/orders/${encodeURIComponent(id)}/cancel`,
  });
}
