import api from './api';

export interface LoginResponse {
  userId: number | string;
  username: string;
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

export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export async function loginApi(payload: LoginRequest): Promise<ApiResult<LoginResponse>> {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export async function adminLoginApi(payload: AdminLoginRequest): Promise<ApiResult<LoginResponse>> {
  const response = await api.post('/auth/admin/login', payload);
  return response.data;
}

export async function registerApi(payload: RegisterRequest): Promise<ApiResult<boolean>> {
  const response = await api.post('/auth/phone-register', payload);
  return response.data;
}

export async function adminRegisterApi(payload: AdminRegisterRequest): Promise<ApiResult<boolean>> {
  const response = await api.post('/auth/admin/register', payload);
  return response.data;
}
