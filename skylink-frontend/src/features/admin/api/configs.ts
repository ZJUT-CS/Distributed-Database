import { request, type PageResult } from '../../../lib/axios';

export interface AdminConfigItem {
  configId: number;
  configName: string;
  configValue: string;
  configDesc?: string | null;
  effectiveTime?: string | null;
  operAdminId?: number | null;
  updateTime?: string | null;
}

export async function listAdminConfigs(params: {
  page: number;
  size: number;
  keyword?: string;
}): Promise<PageResult<AdminConfigItem>> {
  return request<PageResult<AdminConfigItem>>({
    method: 'GET',
    url: '/api/v1/admins/configs',
    params: {
      page: String(params.page),
      size: String(params.size),
      keyword: params.keyword,
    },
  });
}

export async function createAdminConfig(body: {
  configName: string;
  configValue: string;
  configDesc?: string;
  effectiveTime?: string;
}): Promise<AdminConfigItem> {
  const configName = String(body.configName ?? '').trim();
  const configValue = String(body.configValue ?? '').trim();
  if (!configName) throw new Error('缺少 configName');
  if (!configValue) throw new Error('缺少 configValue');

  return request<AdminConfigItem>({
    method: 'POST',
    url: '/api/v1/admins/configs',
    data: {
      configName,
      configValue,
      configDesc: body.configDesc,
      effectiveTime: body.effectiveTime,
    },
  });
}

export async function updateAdminConfig(
  configId: string | number,
  body: { configName: string; configValue: string; configDesc?: string; effectiveTime?: string },
): Promise<boolean> {
  const id = String(configId ?? '').trim();
  if (!id) throw new Error('缺少 configId');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/configs/${encodeURIComponent(id)}`,
    data: body,
  });
}

export async function deleteAdminConfig(configId: string | number): Promise<boolean> {
  const id = String(configId ?? '').trim();
  if (!id) throw new Error('缺少 configId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/configs/${encodeURIComponent(id)}`,
  });
}

