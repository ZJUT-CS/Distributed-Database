import { request } from '@/shared/api/axios';

export interface LoginResponse {
  id?: number | string;
  displayName?: string;
  userId?: number | string;
  username?: string;
  identifier?: string;
  role: 'user' | 'admin';
  token: string;
  adminRole?: number | string;
}

type BackendLoginResponse = {
  id?: number | string;
  displayName?: string | null;
  role?: string | null;
  token?: string | null;
  adminRole?: number | string | null;
};

const normalizeRole = (role: unknown): 'user' | 'admin' => {
  const r = String(role ?? '').toLowerCase();
  return r.includes('admin') ? 'admin' : 'user';
};

const normalizeLogin = (raw: BackendLoginResponse, fallbackIdentifier?: string): LoginResponse => {
  const identifier = (raw.displayName ?? '') || (fallbackIdentifier ?? '');
  const id = raw.id;
  return {
    userId: id,
    id,
    displayName: raw.displayName ?? undefined,
    identifier: identifier || undefined,
    username: identifier || undefined,
    role: normalizeRole(raw.role),
    token: String(raw.token ?? ''),
    adminRole: raw.adminRole ?? undefined,
  };
};

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  password: string;
  email?: string;
  realName?: string;
}

export interface AdminRegisterRequest {
  adminAccount: string;
  password: string;
  role?: number;
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const raw = await request<BackendLoginResponse>({ method: 'POST', url: '/api/v1/users/sessions', data: payload });
  return normalizeLogin(raw, payload.phoneNumber);
}

export interface AdminLoginRequest {
  adminAccount: string;
  password: string;
}

export async function adminLoginApi(payload: AdminLoginRequest): Promise<LoginResponse> {
  // 后端: POST /api/v1/admins/sessions  入参: { adminAccount, password }  返回: LoginResponse
  const raw = await request<BackendLoginResponse>({ method: 'POST', url: '/api/v1/admins/sessions', data: payload });
  const normalized = normalizeLogin(raw, payload.adminAccount);
  return { ...normalized, role: 'admin' };
}

export async function registerApi(payload: RegisterRequest): Promise<boolean> {
  return request<boolean>({ method: 'POST', url: '/api/v1/users', data: payload });
}

export async function adminRegisterApi(payload: AdminRegisterRequest): Promise<boolean> {
  // 后端: POST /api/v1/admins  入参: { adminAccount, password, role? }  返回: boolean
  const adminAccount = String(payload.adminAccount ?? '').trim();
  const password = String(payload.password ?? '').trim();
  if (!adminAccount) throw new Error('缺少 adminAccount');
  if (!password) throw new Error('缺少 password');

  await request<unknown>({
    method: 'POST',
    url: '/api/v1/admins',
    data: { adminAccount, password, role: payload.role },
  });

  return true;
}

export interface UserProfileResponse {
  userId: number | string;
  phoneNumber?: string | null;
  email?: string | null;
  realName?: string | null;
  idCard?: string | null;
  gender?: 0 | 1 | 2 | number | null;
  avatarUrl?: string | null;
  createTime?: string | null;
}

export async function getMyProfile(): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({ method: 'GET', url: '/api/v1/users/me' });
}

export async function updateMyProfile(payload: {
  email?: string | null;
  avatarUrl?: string | null;
  gender?: 0 | 1 | 2 | number | null;
  realName?: string | null;
  idCard?: string | null;
}): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({ method: 'PUT', url: '/api/v1/users/me', data: payload });
}

export async function sendEmailCode(targetEmail: string): Promise<boolean> {
  return request<boolean>({
    method: 'POST',
    url: '/api/v1/users/me/email-verification-codes',
    data: { target: targetEmail },
  });
}

export async function bindEmail(payload: { email: string; code: string }): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({
    method: 'PUT',
    url: '/api/v1/users/me/email',
    data: { value: payload.email, code: payload.code },
  });
}

export async function sendPhoneCode(targetPhone: string): Promise<boolean> {
  return request<boolean>({
    method: 'POST',
    url: '/api/v1/users/me/phone-verification-codes',
    data: { target: targetPhone },
  });
}

export async function bindPhone(payload: { phone: string; code: string }): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({
    method: 'PUT',
    url: '/api/v1/users/me/phone',
    data: { value: payload.phone, code: payload.code },
  });
}

export async function changePassword(payload: { oldPassword: string; newPassword: string }): Promise<boolean> {
  return request<boolean>({
    method: 'PUT',
    url: '/api/v1/users/me/password',
    data: payload,
  });
}

