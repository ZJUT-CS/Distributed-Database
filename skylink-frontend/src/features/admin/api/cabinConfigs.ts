import { request, type PageResult } from '@/shared/api/axios';

/** 舱位配置项 */
export interface CabinConfigItem {
  configId: number;
  modelId: number;
  cabinType: string; // ECONOMY, BUSINESS, FIRST
  cabinCoefficient: number | string;
  cabinLayoutNo: number;
  capacity: number;
  startRowNum: number;
  seatColLayout: string; // 如 'ABCDEF', 'ACHK'
  defaultCarryOn?: string | null;
  defaultChecked?: string | null;
  defaultServices?: string | null;
  // 冗余字段（查询时可能后端填充）
  modelName?: string | null;
}

/** 查询舱位配置列表（分页） */
export async function listCabinConfigs(params: {
  page: number;
  size: number;
  modelId?: number;
  cabinType?: string;
}): Promise<PageResult<CabinConfigItem>> {
  const qp: Record<string, string> = {
    page: String(params.page),
    size: String(params.size),
  };
  if (params.modelId != null) qp.modelId = String(params.modelId);
  if (params.cabinType?.trim()) qp.cabinType = params.cabinType.trim();

  return request<PageResult<CabinConfigItem>>({
    method: 'GET',
    url: '/api/v1/admins/cabin-configs',
    params: qp,
  });
}

/** 创建舱位配置请求参数 */
export interface CabinConfigCreateRequest {
  modelId: number;
  cabinType: string;
  cabinCoefficient: number;
  cabinLayoutNo: number;
  capacity: number;
  startRowNum: number;
  seatColLayout: string;
  defaultCarryOn?: string;
  defaultChecked?: string;
  defaultServices?: string;
}

/** 创建舱位配置 */
export async function createCabinConfig(body: CabinConfigCreateRequest): Promise<CabinConfigItem> {
  const modelId = Number(body.modelId);
  const cabinType = String(body.cabinType ?? '').trim().toUpperCase();
  const cabinCoefficient = Number(body.cabinCoefficient);
  const cabinLayoutNo = Number(body.cabinLayoutNo);
  const capacity = Number(body.capacity);
  const startRowNum = Number(body.startRowNum);
  const seatColLayout = String(body.seatColLayout ?? '').trim().toUpperCase();

  if (!Number.isFinite(modelId)) throw new Error('机型ID无效');
  if (!cabinType) throw new Error('缺少舱位类型');
  if (!Number.isFinite(cabinCoefficient) || cabinCoefficient <= 0) throw new Error('舱位系数无效');
  if (!Number.isFinite(cabinLayoutNo)) throw new Error('布局方案号无效');
  if (!Number.isFinite(capacity) || capacity <= 0) throw new Error('座位数无效');
  if (!Number.isFinite(startRowNum) || startRowNum <= 0) throw new Error('起始行号无效');
  if (!seatColLayout) throw new Error('缺少列布局规则');

  return request<CabinConfigItem>({
    method: 'POST',
    url: '/api/v1/admins/cabin-configs',
    data: {
      modelId,
      cabinType,
      cabinCoefficient,
      cabinLayoutNo,
      capacity,
      startRowNum,
      seatColLayout,
      defaultCarryOn: body.defaultCarryOn,
      defaultChecked: body.defaultChecked,
      defaultServices: body.defaultServices,
    },
  });
}

/** 修改舱位配置 */
export async function updateCabinConfig(configId: number | string, body: Partial<CabinConfigCreateRequest>): Promise<boolean> {
  const id = String(configId ?? '').trim();
  if (!id) throw new Error('缺少 configId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/cabin-configs/${encodeURIComponent(id)}`,
    data: body,
  });
}

/** 删除舱位配置 */
export async function deleteCabinConfig(configId: number | string): Promise<boolean> {
  const id = String(configId ?? '').trim();
  if (!id) throw new Error('缺少 configId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/cabin-configs/${encodeURIComponent(id)}`,
  });
}

/** 舱位类型枚举 */
export const CABIN_TYPE_OPTIONS = [
  { value: 'ECONOMY', label: '经济舱' },
  { value: 'BUSINESS', label: '商务舱' },
  { value: 'FIRST', label: '头等舱' },
];

export const CABIN_TYPE_MAP: Record<string, string> = {
  ECONOMY: '经济舱',
  BUSINESS: '商务舱',
  FIRST: '头等舱',
};
