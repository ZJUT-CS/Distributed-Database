import axios from '@/lib/axios';
import type { PageResult } from './types';

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
  const res = await axios.get<{ code: number; data: AdminItem[]; message?: string }>('/api/v1/admins', {
    params: { keyword: keyword || undefined },
  });
  if (res.data.code !== 0) throw new Error(res.data.message || '查询失败');
  return res.data.data ?? [];
}

export async function listAdminsPage(params: {
  keyword?: string;
  page: number;
  size: number;
}): Promise<PageResult<AdminItem>> {
  const res = await axios.get<{ code: number; data: PageResult<AdminItem>; message?: string }>('/api/v1/admins/page', {
    params: {
      keyword: params.keyword || undefined,
      page: params.page ?? 1,
      size: params.size ?? 10,
    },
  });
  if (res.data.code !== 0) throw new Error(res.data.message || '查询失败');
  return res.data.data ?? { total: 0, data: [] };
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
  const res = await axios.post<{ code: number; data: AdminItem; message?: string }>('/api/v1/admins', req);
  if (res.data.code !== 0) throw new Error(res.data.message || '创建失败');
  return res.data.data;
}

/**
 * 删除管理员
 */
export async function deleteAdmin(adminId: string): Promise<void> {
  const res = await axios.delete<{ code: number; message?: string }>(`/api/v1/admins/${adminId}`);
  if (res.data.code !== 0) throw new Error(res.data.message || '删除失败');
}

/**
 * 重置管理员密码
 */
export async function resetAdminPassword(adminId: string, newPassword: string): Promise<void> {
  const res = await axios.post<{ code: number; message?: string }>(`/api/v1/admins/${adminId}/reset-password`, {
    newPassword,
  });
  if (res.data.code !== 0) throw new Error(res.data.message || '重置密码失败');
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
  keyword?: string;
  module?: string;
  operResult?: number;
  page?: number;
  size?: number;
} = {}): Promise<PageResult<SystemLogItem>> {
  const res = await axios.get<{ code: number; data: PageResult<SystemLogItem>; message?: string }>('/api/v1/admins/system-logs', {
    params: {
      keyword: params.keyword || undefined,
      module: params.module || undefined,
      operResult: params.operResult ?? undefined,
      page: params.page ?? 1,
      size: params.size ?? 20,
    },
  });
  if (res.data.code !== 0) throw new Error(res.data.message || '查询失败');
  return res.data.data ?? { total: 0, data: [] };
}
