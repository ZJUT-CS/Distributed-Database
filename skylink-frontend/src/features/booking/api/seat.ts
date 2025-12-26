import { request, ApiError } from '@/shared/api/axios';

/**
 * 座位信息
 */
export interface Seat {
  seatId: string;
  flightId: string;
  cabinType: string;
  seatNumber: string;
  rowNumber: number;
  columnLetter: string;
  /** 1=可用, 2=已售, 3=锁定中 */
  status: 1 | 2 | 3;
  orderId?: string | null;
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
 * 注意：如果后端未提供此接口，会抛出友好错误
 */
export async function getFlightSeats(
  flightId: string | number,
  cabinType?: string
): Promise<SeatLayoutResponse> {
  const id = String(flightId ?? '').trim();
  if (!id) throw new Error('缺少 flightId');

  const params: Record<string, string> = {};
  if (cabinType) params.cabinType = cabinType;

  try {
    // 后端接口：GET /api/v1/flights/{flightId}/seats
    // 注意：flightId 必须是数据库主键 (Long)，不是航班号字符串
    const rawSeats = await request<any[]>({
      method: 'GET',
      url: `/api/v1/flights/${encodeURIComponent(id)}/seats`,
      params,
    });

    // 防御性处理：确保是数组
    const rawList = Array.isArray(rawSeats) ? rawSeats : [];

    // 转换座位数据，确保 seatId 为有效字符串
    const seatList: Seat[] = rawList.map((s: any) => {
      // seatId 可能是数字、字符串、或 BigInt 表示
      // 【修复】统一转为 string，避免精度丢失
      const seatIdStr = String(s.seatId || '');
      
      // 解析 status：支持数字或字符串
      let statusVal: 1 | 2 | 3 = 2; // 默认不可用
      const st = s.status;
      if (st === 1 || st === 2 || st === 3) {
        statusVal = st as 1 | 2 | 3;
      } else if (typeof st === 'string') {
        const upper = st.toUpperCase();
        if (upper === 'AVAILABLE') statusVal = 1;
        else if (upper === 'OCCUPIED') statusVal = 2;
        else if (upper === 'RESERVED') statusVal = 3; // 锁定/保留
        // MAINTENANCE -> 2
      }

      return {
        seatId: seatIdStr,
        flightId: String(s.flightId || ''),
        cabinType: String(s.cabinType || s.classType || ''),
        seatNumber: String(s.seatNumber || ''),
        rowNumber: typeof s.rowNumber === 'number' ? s.rowNumber : parseInt(String(s.rowNumber || '0'), 10),
        columnLetter: String(s.columnLetter || ''),
        status: statusVal,
        orderId: s.orderId ? String(s.orderId) : null,
        version: s.version ?? undefined,
      };
    }).filter(s => !!s.seatId && s.seatId !== '0');  // 过滤无效 seatId

    if (seatList.length === 0) {
      return {
        seats: [],
        layout: { rows: 0, cols: 0, cabinType: cabinType || 'economy' },
      };
    }

    // 计算布局
    const rows = Math.max(...seatList.map((s) => s.rowNumber), 0);
    const colLetters = [...new Set(seatList.map((s) => s.columnLetter))].sort();
    const cols = colLetters.length;

    return {
      seats: seatList,
      layout: {
        rows,
        cols,
        cabinType: cabinType || seatList[0]?.cabinType || 'economy',
      },
    };
  } catch (e: any) {
    // 如果是404错误，说明后端未提供此接口
    if (e instanceof ApiError && (e.status === 404 || e.code === 404)) {
      throw new Error('选座服务暂不可用，请联系客服或稍后再试');
    }
    throw e;
  }
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
  newSeatId: number | string
): Promise<void> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');
  
  // 移除 Number 转换，避免大整数精度丢失
  const seatIdStr = String(newSeatId);
  if (!seatIdStr) {
    throw new Error('newSeatId 无效');
  }

  await request({
    method: 'PUT',
    url: `/api/v1/orders/${encodeURIComponent(id)}/seat`,
    data: { seatId: seatIdStr },
  });
}
