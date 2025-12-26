import { request, type PageResult } from '@/shared/api/axios';

/**
 * 管理员类型（与后端 Admin 实体对齐）
 */
export interface AdminItem {
  adminId: string;
  adminAccount: string;
  role: number;  // 1-普通管理员，2-超级管理员
  lastLoginTime?: number;
  createTime?: number;
}

/**
 * 获取管理员列表
 */
export async function listAdmins(keyword?: string): Promise<AdminItem[]> {
  return request<AdminItem[]>({
    method: 'GET',
    url: '/api/v1/admins',
    params: { keyword: keyword || undefined },
  });
}

export async function listAdminsPage(params: {
  keyword?: string;
  page: number;
  size: number;
}): Promise<PageResult<AdminItem>> {
  const res = await request<PageResult<AdminItem>>({
    method: 'GET',
    url: '/api/v1/admins/page',
    params: {
      keyword: params.keyword || undefined,
      page: params.page ?? 1,
      size: params.size ?? 10,
    },
  });
  return res ?? { total: 0, data: [] };
}

/**
 * 创建管理员
 */
export interface CreateAdminRequest {
  adminAccount: string;
  password: string;
  role?: number;
}

export async function createAdmin(req: CreateAdminRequest): Promise<AdminItem> {
  return request<AdminItem>({ method: 'POST', url: '/api/v1/admins', data: req });
}

/**
 * 更新管理员
 */
export interface UpdateAdminRequest {
  adminAccount?: string;
  password?: string;
  role?: number;
}

export async function updateAdmin(adminId: string, req: UpdateAdminRequest): Promise<AdminItem> {
  return request<AdminItem>({
    method: 'PUT',
    url: `/api/v1/admins/${encodeURIComponent(String(adminId))}`,
    data: req,
  });
}

/**
 * 删除管理员
 */
export async function deleteAdmin(adminId: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: `/api/v1/admins/${encodeURIComponent(String(adminId))}`,
  });
}

/**
 * 重置管理员密码
 */
export async function resetAdminPassword(adminId: string, newPassword: string): Promise<void> {
  await request<void>({
    method: 'POST',
    url: `/api/v1/admins/${encodeURIComponent(String(adminId))}/reset-password`,
    data: { newPassword },
  });
}

// ==================== 系统日志 ====================

/**
 * 系统日志类型（与后端 SystemLog 实体对齐）
 */
export interface SystemLogItem {
  logId: string;
  operUserType: number;  // 1-用户，2-管理员
  operUserId: number;
  operModule: string;    // flight/order/user/payment/config
  operType: string;      // query/add/update/delete/login/audit
  operContent: string;
  operIp: string;
  operResult: number;    // 1-成功，0-失败
  operTime: string;
}


/**
 * 获取系统日志列表
 */
export async function listSystemLogs(params: {
  adminId?: string;
  keyword?: string;
  module?: string;
  operResult?: number;
  page?: number;
  size?: number;
} = {}): Promise<PageResult<SystemLogItem>> {
  const res = await request<PageResult<SystemLogItem>>({
    method: 'GET',
    url: '/api/v1/admins/system-logs',
    params: {
      adminId: params.adminId ?? undefined,
      keyword: params.keyword || undefined,
      module: params.module || undefined,
      operResult: params.operResult ?? undefined,
      page: params.page ?? 1,
      size: params.size ?? 20,
    },
  });
  return res ?? { total: 0, data: [] };
}
