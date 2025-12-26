import { request, type PageResult } from '@/shared/api/axios';

export interface AdminUserItem {
  userId: string | number;
  phoneNumber?: string | null;
  realName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  gender?: number | null;
  idCardMasked?: string | null;
  idCardPresent?: boolean | null;
  userStatus?: number | null;
  createTime?: string | null;
}

export async function listAdminUsers(params: {
  page: number;
  size: number;
  keyword?: string;
  status?: number;
}): Promise<PageResult<AdminUserItem>> {
  return request<PageResult<AdminUserItem>>({
    method: 'GET',
    url: '/api/v1/admins/users',
    params: {
      page: String(params.page),
      size: String(params.size),
      keyword: params.keyword,
      status: params.status != null ? String(params.status) : undefined,
    },
  });
}

export async function createAdminUser(body: {
  phoneNumber: string;
  password: string;
  email?: string;
  realName?: string;
}): Promise<AdminUserItem> {
  const phoneNumber = String(body.phoneNumber ?? '').trim();
  const password = String(body.password ?? '').trim();
  if (!phoneNumber) throw new Error('缺少 phoneNumber');
  if (!password) throw new Error('缺少 password');

  return request<AdminUserItem>({
    method: 'POST',
    url: '/api/v1/admins/users',
    data: {
      phoneNumber,
      password,
      email: body.email,
      realName: body.realName,
    },
  });
}

export async function updateAdminUser(
  userId: string | number,
  body: {
    phoneNumber?: string;
    email?: string;
    realName?: string;
    avatarUrl?: string;
    idCard?: string;
    gender?: number;
    userStatus?: number;
  },
): Promise<boolean> {
  const id = String(userId ?? '').trim();
  if (!id) throw new Error('缺少 userId');
  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/users/${encodeURIComponent(id)}`,
    data: body,
  });
}

export async function resetAdminUserPassword(userId: string | number, password: string): Promise<boolean> {
  const id = String(userId ?? '').trim();
  const pwd = String(password ?? '').trim();
  if (!id) throw new Error('缺少 userId');
  if (!pwd) throw new Error('缺少 password');

  return request<boolean>({
    method: 'PUT',
    url: `/api/v1/admins/users/${encodeURIComponent(id)}/password`,
    data: { password: pwd },
  });
}

export async function deleteAdminUser(userId: string | number): Promise<boolean> {
  const id = String(userId ?? '').trim();
  if (!id) throw new Error('缺少 userId');

  return request<boolean>({
    method: 'DELETE',
    url: `/api/v1/admins/users/${encodeURIComponent(id)}`,
  });
}

