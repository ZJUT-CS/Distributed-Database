import api from './api';

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

export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export async function loginApi(payload: LoginRequest): Promise<ApiResult<string>> {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function registerApi(payload: RegisterRequest): Promise<ApiResult<boolean>> {
  const response = await api.post('/auth/phone-register', payload);
  return response.data;
}
