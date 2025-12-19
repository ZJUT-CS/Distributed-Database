import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  items: T[];
}

export class ApiError extends Error {
  code?: number;
  status?: number;
  requestId?: string;
  raw?: unknown;

  constructor(message: string, init?: Partial<ApiError>) {
    super(message);
    this.name = 'ApiError';
    Object.assign(this, init);
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9999',
  timeout: 10000,
});

const parseStoredUser = (): { id?: number | string; role?: string } | null => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;
    if (!parsed || typeof parsed !== 'object') return null;
    return { id: parsed.id, role: parsed.role };
  } catch {
    return null;
  }
};

const genRequestId = () => {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `rid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const getHeader = (headers: any, key: string) => {
  if (!headers) return undefined;
  return headers[key] ?? headers[key.toLowerCase()];
};

api.interceptors.request.use(
  (config) => {
    const headers: any = (config.headers ??= {} as any);
    headers.Accept ??= 'application/json';

    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization ??= `Bearer ${token}`;
    }

    const user = parseStoredUser();
    if (user?.id !== undefined && user?.id !== null && String(user.id).trim() !== '') {
      headers['X-User-Id'] ??= String(user.id);
      headers['X-User-Type'] ??= user.role === 'admin' ? '2' : '1';
    }

    headers['X-Request-Id'] ??= genRequestId();

    // 幂等键：写请求默认携带，防止重复提交（网络重试/双击）
    const method = (config.method || 'get').toLowerCase();
    if ((method === 'post' || method === 'put' || method === 'patch') && headers['Idempotency-Key'] == null) {
      headers['Idempotency-Key'] = headers['X-Request-Id'];
    }

    if ((method === 'post' || method === 'put' || method === 'patch') && headers['Content-Type'] == null) {
      headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const body = response.data as any;
    if (body && typeof body === 'object' && typeof body.code === 'number' && 'msg' in body) {
      if (body.code !== 0) {
        const requestId = getHeader(response.headers, 'x-request-id');
        if (body.code === 401) {
          localStorage.removeItem('token');
        }
        return Promise.reject(
          new ApiError(body.msg || '请求失败', {
            code: body.code,
            status: response.status,
            requestId,
            raw: body,
          })
        );
      }
    }
    return response;
  },
  (error: AxiosError) => {
    const requestId = getHeader((error.response as any)?.headers, 'x-request-id');
    const status = error.response?.status;
    const data: any = error.response?.data;

    if (data && typeof data === 'object' && typeof data.code === 'number' && 'msg' in data) {
      if (data.code === 401) {
        localStorage.removeItem('token');
      }
      return Promise.reject(
        new ApiError(data.msg || '请求失败', {
          code: data.code,
          status,
          requestId,
          raw: data,
        })
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('请求超时，请稍后重试', { status, requestId, raw: error }));
    }

    if (!error.response) {
      return Promise.reject(new ApiError('网络错误，请检查网络或服务是否启动', { requestId, raw: error }));
    }

    if (status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(new ApiError(`请求失败（HTTP ${status ?? 'unknown'}）`, { status, requestId, raw: error }));
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const resp = await api.request<ApiResult<T>>(config);
  const body = resp.data;
  return body?.data as T;
}

export default api;
