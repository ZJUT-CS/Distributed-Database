import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import JSONBig from 'json-bigint';

const JSONbig = JSONBig({ storeAsString: true });

export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  data: T[];
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
  // 避免雪花ID等超大整数在前端 JSON.parse 后丢失精度
  // storeAsString: true -> 超过安全整数范围的数字会被解析为字符串
  transformResponse: [
    (data) => {
      if (typeof data !== 'string') return data;
      const raw = data.trim();
      if (!raw) return data;
      // 只对 JSON 文本尝试解析
      if (!(raw.startsWith('{') || raw.startsWith('['))) return data;
      try {
        return JSONbig.parse(raw);
      } catch {
        try {
          return JSON.parse(raw);
        } catch {
          return data;
        }
      }
    },
  ],
});

const normalizeUserRole = (role: unknown): 'user' | 'admin' => {
  if (role === 2 || role === '2') return 'admin';
  const r = String(role ?? '').trim().toLowerCase();
  return r.includes('admin') ? 'admin' : 'user';
};

const TOKEN_KEY = 'skylink_token';
const USER_KEY = 'skylink_user';

const parseStoredUser = (): { id?: number | string; role?: 'user' | 'admin'; adminRole?: string } | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;
    if (!parsed || typeof parsed !== 'object') return null;

    const id = parsed.id ?? parsed.userId;
    const role = normalizeUserRole(parsed.role);
    const adminRoleRaw = parsed.adminRole ?? parsed.admin_role ?? parsed.roleId ?? parsed.role_id;
    const adminRole = adminRoleRaw == null ? undefined : String(adminRoleRaw).trim();

    return { id, role, adminRole };
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

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers.Authorization ??= `Bearer ${token}`;
    }

    const user = parseStoredUser();
    if (user) {
      const userType = user.role === 'admin' ? '2' : '1';
      headers['X-User-Type'] ??= userType;

      if (user?.id !== undefined && user?.id !== null && String(user.id).trim() !== '') {
        headers['X-User-Id'] ??= String(user.id);
      }

      // 部分后台接口要求超级管理员：X-Admin-Role=2
      // 如果 localStorage.user 里带了 adminRole，则优先使用；否则 admin 一律按 2 发送。
      if (userType === '2') {
        headers['X-Admin-Role'] ??= user.adminRole && user.adminRole !== '' ? user.adminRole : '2';
      }
    }

    headers['X-Request-Id'] ??= genRequestId();

    const method = (config.method || 'get').toLowerCase();
    if ((method === 'post' || method === 'put' || method === 'patch') && headers['Idempotency-Key'] == null) {
      headers['Idempotency-Key'] = headers['X-Request-Id'];
    }

    if ((method === 'post' || method === 'put' || method === 'patch') && headers['Content-Type'] == null) {
      headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const body = response.data as any;
    if (body && typeof body === 'object' && typeof body.code === 'number' && 'msg' in body) {
      if (body.code !== 0) {
        const requestId = getHeader(response.headers, 'x-request-id');
        if (body.code === 401) {
          localStorage.removeItem(TOKEN_KEY);
        }
        return Promise.reject(
          new ApiError(body.msg || '请求失败', {
            code: body.code,
            status: response.status,
            requestId,
            raw: body,
          }),
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
        localStorage.removeItem(TOKEN_KEY);
      }
      return Promise.reject(
        new ApiError(data.msg || '请求失败', {
          code: data.code,
          status,
          requestId,
          raw: data,
        }),
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('请求超时，请稍后重试', { status, requestId, raw: error }));
    }

    if (!error.response) {
      return Promise.reject(new ApiError('网络错误，请检查网络或服务是否启动', { requestId, raw: error }));
    }

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    return Promise.reject(new ApiError(`请求失败（HTTP ${status ?? 'unknown'}）`, { status, requestId, raw: error }));
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const resp = await api.request<ApiResult<T>>(config);
  const body = resp.data;
  return body?.data as T;
}

export default api;
