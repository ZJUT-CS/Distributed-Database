import { request } from './api';

export interface LoginResponse {
  id?: number | string;
  displayName?: string;
  userId?: number | string;
  username?: string;
  role: 'user' | 'admin';
  token: string;
}

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
  username: string;
  password: string;
  role?: number;
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>({ method: 'POST', url: '/auth/login', data: payload });
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export async function adminLoginApi(payload: AdminLoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>({ method: 'POST', url: '/auth/admin/login', data: payload });
}

export async function registerApi(payload: RegisterRequest): Promise<boolean> {
  return request<boolean>({ method: 'POST', url: '/auth/phone-register', data: payload });
}

export async function adminRegisterApi(payload: AdminRegisterRequest): Promise<boolean> {
  return request<boolean>({ method: 'POST', url: '/auth/admin/register', data: payload });
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
  return request<UserProfileResponse>({ method: 'GET', url: '/api/v1/auth/user/me' });
}

export async function updateMyProfile(payload: {
  email?: string | null;
  avatarUrl?: string | null;
  gender?: 0 | 1 | 2 | number | null;
  realName?: string | null;
  idCard?: string | null;
}): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({ method: 'PUT', url: '/api/v1/auth/user/profile', data: payload });
}

export async function sendEmailCode(targetEmail: string): Promise<boolean> {
  return request<boolean>({
    method: 'POST',
    url: '/api/v1/auth/user/email/send-code',
    data: { target: targetEmail },
  });
}

export async function bindEmail(payload: { email: string; code: string }): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({
    method: 'PUT',
    url: '/api/v1/auth/user/email',
    data: { value: payload.email, code: payload.code },
  });
}

export async function sendPhoneCode(targetPhone: string): Promise<boolean> {
  return request<boolean>({
    method: 'POST',
    url: '/api/v1/auth/user/phone/send-code',
    data: { target: targetPhone },
  });
}

export async function bindPhone(payload: { phone: string; code: string }): Promise<UserProfileResponse> {
  return request<UserProfileResponse>({
    method: 'PUT',
    url: '/api/v1/auth/user/phone',
    data: { value: payload.phone, code: payload.code },
  });
}

export async function changePassword(payload: { oldPassword: string; newPassword: string }): Promise<boolean> {
  return request<boolean>({
    method: 'PUT',
    url: '/api/v1/auth/user/password',
    data: payload,
  });
}
