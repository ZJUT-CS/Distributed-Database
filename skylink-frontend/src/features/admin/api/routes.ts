import { request, type PageResult } from '../../../lib/axios';

/** 航线项 */
export interface RouteItem {
  routeId: number;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  basePrice: number | string;
  estimatedDuration?: number | null;
  distanceKm?: number | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 航线下拉选项（简化） */
export interface RouteOption {
  routeId: number;
  label: string; // 格式：出发城市(机场) → 到达城市(机场)
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  basePrice: number;
  estimatedDuration?: number | null;
}

/** 查询航线列表（分页） */
export async function listRoutes(params: {
  page: number;
  size: number;
  keyword?: string;
  departureCity?: string;
  arrivalCity?: string;
}): Promise<PageResult<RouteItem>> {
  const qp: Record<string, string> = {
    page: String(params.page),
    size: String(params.size),
  };
  if (params.keyword?.trim()) qp.keyword = params.keyword.trim();
  if (params.departureCity?.trim()) qp.departureCity = params.departureCity.trim();
  if (params.arrivalCity?.trim()) qp.arrivalCity = params.arrivalCity.trim();

  return request<PageResult<RouteItem>>({
    method: 'GET',
    url: '/api/v1/admins/routes',
    params: qp,
  });
}

/** 获取航线下拉选项（全量或前N条） */
export async function listRouteOptions(limit = 200): Promise<RouteOption[]> {
  const res = await listRoutes({ page: 1, size: limit });
  return (res.items ?? []).map((r: RouteItem) => ({
    routeId: r.routeId,
    label: `${r.departureCity}(${r.departureAirport}) → ${r.arrivalCity}(${r.arrivalAirport})`,
    departureCity: r.departureCity,
    departureAirport: r.departureAirport,
    arrivalCity: r.arrivalCity,
    arrivalAirport: r.arrivalAirport,
    basePrice: Number(r.basePrice),
    estimatedDuration: r.estimatedDuration,
  }));
}

/** 创建航线请求参数 */
export interface RouteCreateRequest {
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  basePrice: number;
  estimatedDuration?: number;
  distanceKm?: number;
}

/** 创建航线 */
export async function createRoute(body: RouteCreateRequest): Promise<RouteItem> {
  const departureCity = String(body.departureCity ?? '').trim();
  const departureAirport = String(body.departureAirport ?? '').trim();
  const arrivalCity = String(body.arrivalCity ?? '').trim();
  const arrivalAirport = String(body.arrivalAirport ?? '').trim();
  const basePrice = Number(body.basePrice);

  if (!departureCity) throw new Error('缺少出发城市');
  if (!departureAirport) throw new Error('缺少出发机场三字码');
  if (!arrivalCity) throw new Error('缺少到达城市');
  if (!arrivalAirport) throw new Error('缺少到达机场三字码');
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new Error('基准票价无效');

  return request<RouteItem>({
    method: 'POST',
    url: '/api/v1/admins/routes',
    data: {
      departureCity,
      departureAirport,
      arrivalCity,
      arrivalAirport,
      basePrice,
      estimatedDuration: body.estimatedDuration,
      distanceKm: body.distanceKm,
    },
  });
}

/** 修改航线 */
export async function updateRoute(routeId: number | string, body: Partial<RouteCreateRequest>): Promise<boolean> {
  const id = String(routeId ?? '').trim();
  if (!id) throw new Error('缺少 routeId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/routes/${encodeURIComponent(id)}`,
    data: body,
  });
}

/** 删除航线 */
export async function deleteRoute(routeId: number | string): Promise<boolean> {
  const id = String(routeId ?? '').trim();
  if (!id) throw new Error('缺少 routeId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/routes/${encodeURIComponent(id)}`,
  });
}
