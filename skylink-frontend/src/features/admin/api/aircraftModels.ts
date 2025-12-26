import { request, type PageResult } from '@/shared/api/axios';

/** 机型项 */
export interface AircraftModelItem {
  modelId: number;
  modelName: string;
  manufacturer?: string | null;
  totalPhysicalSeats: number;
}

/** 机型下拉选项（简化） */
export interface AircraftModelOption {
  modelId: number;
  label: string; // 格式：机型名 (制造商) - 总座位数
  modelName: string;
  manufacturer?: string | null;
  totalPhysicalSeats: number;
}

/** 查询机型列表（分页） */
export async function listAircraftModels(params: {
  page: number;
  size: number;
  keyword?: string;
}): Promise<PageResult<AircraftModelItem>> {
  const qp: Record<string, string> = {
    page: String(params.page),
    size: String(params.size),
  };
  if (params.keyword?.trim()) qp.keyword = params.keyword.trim();

  return request<PageResult<AircraftModelItem>>({
    method: 'GET',
    url: '/api/v1/admins/aircraft-models',
    params: qp,
  });
}

/** 获取机型下拉选项（全量或前N条） */
export async function listAircraftModelOptions(limit = 500): Promise<AircraftModelOption[]> {
  const res = await listAircraftModels({ page: 1, size: limit });
  return (res.data ?? []).map((m: AircraftModelItem) => ({
    modelId: m.modelId,
    label: `${m.modelName}${m.manufacturer ? ` (${m.manufacturer})` : ''} - ${m.totalPhysicalSeats}座`,
    modelName: m.modelName,
    manufacturer: m.manufacturer,
    totalPhysicalSeats: m.totalPhysicalSeats,
  }));
}

/** 创建机型请求参数 */
export interface AircraftModelCreateRequest {
  modelName: string;
  manufacturer?: string;
  totalPhysicalSeats: number;
}

/** 创建机型 */
export async function createAircraftModel(body: AircraftModelCreateRequest): Promise<AircraftModelItem> {
  const modelName = String(body.modelName ?? '').trim();
  const totalPhysicalSeats = Number(body.totalPhysicalSeats);

  if (!modelName) throw new Error('缺少机型名称');
  if (!Number.isFinite(totalPhysicalSeats) || totalPhysicalSeats <= 0) throw new Error('总座位数无效');

  return request<AircraftModelItem>({
    method: 'POST',
    url: '/api/v1/admins/aircraft-models',
    data: {
      modelName,
      manufacturer: body.manufacturer?.trim() || null,
      totalPhysicalSeats,
    },
  });
}

/** 修改机型 */
export async function updateAircraftModel(modelId: number | string, body: Partial<AircraftModelCreateRequest>): Promise<boolean> {
  const id = String(modelId ?? '').trim();
  if (!id) throw new Error('缺少 modelId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/aircraft-models/${encodeURIComponent(id)}`,
    data: body,
  });
}

/** 删除机型 */
export async function deleteAircraftModel(modelId: number | string): Promise<boolean> {
  const id = String(modelId ?? '').trim();
  if (!id) throw new Error('缺少 modelId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/aircraft-models/${encodeURIComponent(id)}`,
  });
}
