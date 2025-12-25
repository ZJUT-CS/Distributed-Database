import { request } from '../../../lib/axios';

export interface OrderSearchResult {
  orderNo: string;
  flightNo?: string | null;
  /** 舱位类型（如 Y/J/F 或 economy/business/first，具体以后端为准） */
  cabinType?: string | null;
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
  // 联程订单关联字段
  flightId?: string | null;
  seatId?: string | null;
  parentOrderId?: string | null;
}

export type CreateOrderResult = OrderSearchResult;

export async function createOrder(body: {
  userId: string | number;
  flightId?: string | number | null;
  flightIds?: Array<string | number> | null;
  cabinType: string;
  ticketNum: number;
  passengerName: string;
  contactEmail?: string;
  contactPhone?: string;
  passengersJson?: string;
}): Promise<CreateOrderResult> {
  const userId = String(body.userId ?? '').trim();
  if (!userId) throw new Error('缺少 userId');
  const flightIds = Array.isArray(body.flightIds) ? body.flightIds.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
  const flightId = String(body.flightId ?? '').trim();
  if (flightIds.length === 0 && !flightId) throw new Error('缺少 flightId/flightIds');
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
      flightId: flightIds.length > 0 ? undefined : flightId,
      flightIds: flightIds.length > 0 ? flightIds : undefined,
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
  const res = await request<OrderSearchResult[] | { total: number; data: OrderSearchResult[] }>({
    method: 'GET',
    url: '/api/v1/orders',
    params: {
      ...params,
      userId: params.userId ? String(params.userId) : undefined,
      orderNo: params.orderNo ? String(params.orderNo) : undefined,
    },
  });

  // 兼容分页结构：如果返回的是分页对象 { total, data: [] }，则提取 data
  if (res && !Array.isArray(res) && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
    return (res as any).data;
  }

  // 已经是数组，或者是其他情况（返回空数组兜底）
  return Array.isArray(res) ? res : [];
}

