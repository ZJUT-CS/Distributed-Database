import { request } from '../../../lib/axios';

/**
 * 座位信息
 */
export interface Seat {
  seatId: number;
  flightId: number;
  cabinType: string;
  seatNumber: string;
  rowNumber: number;
  columnLetter: string;
  /** 1=可用, 2=已售, 3=锁定中 */
  status: 1 | 2 | 3;
  orderId?: number | null;
  version?: number;
}

/**
 * 座位布局响应
 */
export interface SeatLayoutResponse {
  seats: Seat[];
  layout: {
    rows: number;
    cols: number;
    cabinType: string;
  };
}

/**
 * 查询航班座位布局
 */
export async function getFlightSeats(
  flightId: string | number,
  cabinType?: string
): Promise<SeatLayoutResponse> {
  const id = String(flightId ?? '').trim();
  if (!id) throw new Error('缺少 flightId');

  const params: Record<string, string> = {};
  if (cabinType) params.cabinType = cabinType;

  // 注意：需要后端提供此接口，当前使用 seats 表查询
  const seats = await request<Seat[]>({
    method: 'GET',
    url: `/api/v1/flights/${encodeURIComponent(id)}/seats`,
    params,
  });

  // 计算布局
  const rows = Math.max(...seats.map((s) => s.rowNumber), 0);
  const colLetters = [...new Set(seats.map((s) => s.columnLetter))].sort();
  const cols = colLetters.length;

  return {
    seats,
    layout: {
      rows,
      cols,
      cabinType: cabinType || seats[0]?.cabinType || 'economy',
    },
  };
}

/**
 * 查询可用座位数量
 */
export async function getAvailableSeatCount(
  flightId: string | number,
  cabinType: string
): Promise<number> {
  const id = String(flightId ?? '').trim();
  if (!id) throw new Error('缺少 flightId');

  const result = await request<{ count: number }>({
    method: 'GET',
    url: `/api/v1/flights/${encodeURIComponent(id)}/seats/available-count`,
    params: { cabinType },
  });

  return result.count;
}

/**
 * 支付后换座
 */
export async function changeSeat(
  orderId: string | number,
  newSeatId: number
): Promise<boolean> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');
  if (!Number.isFinite(newSeatId) || newSeatId <= 0) {
    throw new Error('newSeatId 无效');
  }

  const result = await request<{ success: boolean }>({
    method: 'PUT',
    url: `/api/v1/orders/${encodeURIComponent(id)}/seat`,
    data: { newSeatId },
  });

  return result.success;
}
