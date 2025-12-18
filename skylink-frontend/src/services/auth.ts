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
