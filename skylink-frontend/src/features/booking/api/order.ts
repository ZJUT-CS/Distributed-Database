import { request } from '../../../lib/axios';

export interface OrderSearchResult {
  orderNo: string;
  flightNo?: string | null;
  passengerName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  passengersJson?: string | null;
  orderStatus?: number | null;
  totalAmount?: number | null;
  orderTime?: string | null;
  payTime?: string | null;
  refundTime?: string | null;
  changeTime?: string | null;
  origin?: string | null;
  destination?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
}

export type CreateOrderResult = OrderSearchResult;

export async function createOrder(body: {
  userId: string | number;
  flightNo: string;
  cabinType: string;
  ticketNum: number;
  passengerName: string;
  contactEmail?: string;
  contactPhone?: string;
  passengersJson?: string;
}): Promise<CreateOrderResult> {
  const userId = String(body.userId ?? '').trim();
  if (!userId) throw new Error('缺少 userId');
  const flightNo = String(body.flightNo ?? '').trim();
  if (!flightNo) throw new Error('缺少 flightNo');
  const cabinType = String(body.cabinType ?? '').trim();
  if (!cabinType) throw new Error('缺少 cabinType');
  if (!Number.isFinite(body.ticketNum) || body.ticketNum <= 0) throw new Error('ticketNum 无效');
  const passengerName = String(body.passengerName ?? '').trim();
  if (!passengerName) throw new Error('缺少 passengerName');

  return request<CreateOrderResult>({
    method: 'POST',
    url: '/api/v1/orders',
    data: {
      userId: userId,
      flightNo,
      cabinType,
      ticketNum: Math.floor(body.ticketNum),
      passengerName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      passengersJson: body.passengersJson,
    },
  });
}

export async function cancelOrder(orderId: string | number): Promise<void> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');

  await request({
    method: 'POST',
    url: `/api/v1/orders/${encodeURIComponent(id)}/cancellation`,
  });
}

export async function searchOrders(params: {
  userId?: string | number;
  orderNo?: string | number;
  orderStatus?: number;
  createTimeStart?: string;
  createTimeEnd?: string;
  flightNo?: string;
  cabinType?: string;
}): Promise<OrderSearchResult[]> {
  return request<OrderSearchResult[]>({
    method: 'GET',
    url: '/api/v1/orders',
    params: {
      ...params,
      userId: params.userId ? String(params.userId) : undefined,
      orderNo: params.orderNo ? String(params.orderNo) : undefined,
    },
  });
}

