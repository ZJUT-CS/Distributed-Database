import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import JSONBig from 'json-bigint';
import { clearStoredToken, readStoredUserHeaderInfo, readStoredToken } from './authStorage';

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

/**
 * 错误类型枚举
 * - VALIDATION: 参数错误，无需重试
 * - AUTH: 认证错误，需重新登录
 * - PERMISSION: 权限错误，无需重试
 * - CONFLICT: 业务冲突，可重试
 * - SERVER: 服务器错误，可重试
 * - NETWORK: 网络错误，可重试
 * - TIMEOUT: 请求超时，可重试
 * - UNKNOWN: 未知错误
 */
export type ErrorType = 'VALIDATION' | 'AUTH' | 'PERMISSION' | 'CONFLICT' | 'SERVER' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN';

export class ApiError extends Error {
  code?: number;
  status?: number;
  requestId?: string;
  raw?: unknown;
  /** 错误类型 */
  errorType: ErrorType;
  /** 是否可重试 */
  retryable: boolean;
  /** 用户友好的提示消息 */
  userMessage: string;

  constructor(message: string, init?: Partial<ApiError>) {
    super(message);
    this.name = 'ApiError';
    Object.assign(this, init);

    // 自动推断错误类型和可重试性
    const code = init?.code ?? init?.status;
    const { errorType, retryable, userMessage } = ApiError.classifyError(code, message);
    this.errorType = init?.errorType ?? errorType;
    this.retryable = init?.retryable ?? retryable;
    this.userMessage = init?.userMessage ?? userMessage;
  }

  /** 根据错误码分类错误 */
  static classifyError(code?: number, message?: string): { errorType: ErrorType; retryable: boolean; userMessage: string } {
    if (!code) {
      return { errorType: 'UNKNOWN', retryable: true, userMessage: message || '发生未知错误' };
    }

    // 400: 参数校验失败，不可重试
    if (code === 400) {
      return { errorType: 'VALIDATION', retryable: false, userMessage: message || '请求参数有误，请检查后重试' };
    }

    // 401: 认证失败，需重新登录
    if (code === 401) {
      return { errorType: 'AUTH', retryable: false, userMessage: '登录已过期，请重新登录' };
    }

    // 403: 权限不足，不可重试
    if (code === 403) {
      return { errorType: 'PERMISSION', retryable: false, userMessage: '您没有权限执行此操作' };
    }

    // 404: 资源不存在，不可重试
    if (code === 404) {
      return { errorType: 'VALIDATION', retryable: false, userMessage: '请求的资源不存在' };
    }

    // 409: 业务冲突（如座位被占用），可重试
    if (code === 409) {
      return { errorType: 'CONFLICT', retryable: true, userMessage: message || '操作冲突，请稍后重试' };
    }

    // 5xx: 服务器错误，可重试
    if (code >= 500) {
      return { errorType: 'SERVER', retryable: true, userMessage: '服务器繁忙，请稍后重试' };
    }

    // 其他4xx: 客户端错误，不可重试
    if (code >= 400 && code < 500) {
      return { errorType: 'VALIDATION', retryable: false, userMessage: message || '请求失败，请稍后重试' };
    }

    return { errorType: 'UNKNOWN', retryable: true, userMessage: message || '发生未知错误' };
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

    const token = readStoredToken();
    if (token) {
      headers.Authorization ??= `Bearer ${token}`;
    }

    const user = readStoredUserHeaderInfo();
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
          clearStoredToken();
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
        clearStoredToken();
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
      clearStoredToken();
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
