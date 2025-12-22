import { request, type PageResult } from '../../../lib/axios';

export interface AdminFlightItem {
  flightId: string | number;
  flightNo: string;
  modelId: number;
  routeId: number;
  departureTime: string;
  arrivalTime?: string | null;
  departureCity?: string | null;
  departureAirport?: string | null;
  arrivalCity?: string | null;
  arrivalAirport?: string | null;
  airlineCompany: string;
  totalSeats?: number | null;
  stopoverInfo?: string | null;
  status?: number | null;
  lowestPrice?: number | string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

export async function listAdminFlights(params: {
  page: number;
  size: number;
  keyword?: string;
  flightNo?: string;
  departureCity?: string;
  arrivalCity?: string;
}): Promise<PageResult<AdminFlightItem>> {
  const qp: Record<string, string> = {
    page: String(params.page),
    size: String(params.size),
  };
  if (params.keyword != null && String(params.keyword).trim() !== '') qp.keyword = String(params.keyword).trim();
  if (params.flightNo != null && String(params.flightNo).trim() !== '') qp.flightNo = String(params.flightNo).trim();
  if (params.departureCity != null && String(params.departureCity).trim() !== '') qp.departureCity = String(params.departureCity).trim();
  if (params.arrivalCity != null && String(params.arrivalCity).trim() !== '') qp.arrivalCity = String(params.arrivalCity).trim();

  return request<PageResult<AdminFlightItem>>({
    method: 'GET',
    url: '/api/v1/admins/flights',
    params: qp,
  });
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const toBackendDateTime = (input: string | undefined | null): string | undefined => {
  const v = String(input ?? '').trim();
  if (!v) return undefined;

  // 支持 datetime-local: 2025-12-20T09:00
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, y, mo, d, hh, mm, ss] = m;
    return `${y}-${mo}-${d} ${hh}:${mm}:${ss ?? '00'}`;
  }

  // 若已是后端格式则原样返回
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) return v;

  return v;
};

export interface AdminFlightUpsertRequest {
  flightNo: string;
  modelId: number;
  routeId: number;
  departureTime: string;
  arrivalTime?: string;
  airlineCompany: string;
  totalSeats?: number;
  layoutNo?: number;
  stopoverInfo?: string;
  status?: number;
}

export async function createAdminFlight(body: AdminFlightUpsertRequest): Promise<boolean> {
  const flightNo = String(body.flightNo ?? '').trim();
  const airlineCompany = String(body.airlineCompany ?? '').trim();
  const modelId = Number(body.modelId);
  const routeId = Number(body.routeId);
  const departureTime = toBackendDateTime(body.departureTime);
  const arrivalTime = toBackendDateTime(body.arrivalTime);

  if (!flightNo) throw new Error('缺少 flightNo');
  if (!Number.isFinite(modelId)) throw new Error('modelId 无效');
  if (!Number.isFinite(routeId)) throw new Error('routeId 无效');
  if (!departureTime) throw new Error('缺少 departureTime');
  if (!airlineCompany) throw new Error('缺少 airlineCompany');

  return request<boolean>({
    method: 'POST',
    url: '/api/v1/admins/flights',
    data: {
      flightNo,
      modelId,
      routeId,
      departureTime,
      arrivalTime,
      airlineCompany,
      totalSeats: body.totalSeats,
      layoutNo: body.layoutNo,
      stopoverInfo: body.stopoverInfo,
      status: body.status,
    },
  });
}

export async function updateAdminFlight(flightId: string | number, body: AdminFlightUpsertRequest): Promise<boolean> {
  const id = String(flightId ?? '').trim();
  if (!id) throw new Error('缺少 flightId');

  const flightNo = String(body.flightNo ?? '').trim();
  const airlineCompany = String(body.airlineCompany ?? '').trim();
  const modelId = Number(body.modelId);
  const routeId = Number(body.routeId);
  const departureTime = toBackendDateTime(body.departureTime);
  const arrivalTime = toBackendDateTime(body.arrivalTime);

  if (!flightNo) throw new Error('缺少 flightNo');
  if (!Number.isFinite(modelId)) throw new Error('modelId 无效');
  if (!Number.isFinite(routeId)) throw new Error('routeId 无效');
  if (!departureTime) throw new Error('缺少 departureTime');
  if (!airlineCompany) throw new Error('缺少 airlineCompany');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/flights/${encodeURIComponent(id)}`,
    data: {
      flightNo,
      modelId,
      routeId,
      departureTime,
      arrivalTime,
      airlineCompany,
      totalSeats: body.totalSeats,
      layoutNo: body.layoutNo,
      stopoverInfo: body.stopoverInfo,
      status: body.status,
    },
  });
}

export async function deleteAdminFlight(flightId: string | number): Promise<boolean> {
  const id = String(flightId ?? '').trim();
  if (!id) throw new Error('缺少 flightId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/flights/${encodeURIComponent(id)}`,
  });
}
