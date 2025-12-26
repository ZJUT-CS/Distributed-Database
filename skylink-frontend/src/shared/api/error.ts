import { ApiError, type ErrorType } from '@/shared/api/axios';

export interface FormatErrorOptions {
  defaultMessage?: string;
  showCode?: boolean;
  showRequestId?: boolean;
}

export interface ErrorHandlerOptions {
  onRetry?: () => void;
  onAuthError?: () => void;
  showToast?: boolean;
  customMessage?: string;
}

export interface ErrorHandlerResult {
  message: string;
  type: ErrorType;
  retryable: boolean;
  shouldRedirectToLogin: boolean;
}

const ERROR_CODE_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '无权限执行此操作',
  404: '请求的资源不存在',
  500: '服务器内部错误',

  1001: '用户名或密码错误',
  1002: '用户已被禁用',
  1003: '用户不存在',
  1004: '手机号已被注册',
  1005: '邮箱已被注册',
  1006: '证件号已被注册',

  2001: '航班不存在',
  2002: '航班已取消',
  2003: '航班座位已满',
  2004: '航班时间冲突',

  3001: '订单不存在',
  3002: '订单状态异常',
  3003: '订单已过期',
  3004: '支付失败',
  3005: '退款失败',

  4001: '航线不存在',
  4002: '机型不存在',
  4003: '舱位配置不存在',
};

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '无权限执行此操作',
  404: '请求的资源不存在',
  408: '请求超时，请稍后重试',
  429: '操作过于频繁，请稍后重试',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂不可用',
  504: '网关超时',
};

export function formatApiError(
  error: unknown,
  options: FormatErrorOptions = {}
): string {
  const {
    defaultMessage = '操作失败，请稍后重试',
    showCode = false,
    showRequestId = false,
  } = options;

  if (error instanceof ApiError) {
    let message = error.message;

    if (!message || message === '请求失败') {
      if (error.code && ERROR_CODE_MESSAGES[error.code]) {
        message = ERROR_CODE_MESSAGES[error.code];
      }
      else if (error.status && HTTP_STATUS_MESSAGES[error.status]) {
        message = HTTP_STATUS_MESSAGES[error.status];
      }
      else {
        message = defaultMessage;
      }
    }

    if (showCode && error.code) {
      message = `${message}（错误码: ${error.code}）`;
    }

    if (showRequestId && error.requestId) {
      message = `${message}（请求ID: ${error.requestId}）`;
    }

    return message;
  }

  if (error instanceof Error) {
    if (error.message.includes('Network') || error.message.includes('网络')) {
      return '网络连接失败，请检查网络';
    }
    if (error.message.includes('timeout') || error.message.includes('超时')) {
      return '请求超时，请稍后重试';
    }
    return error.message || defaultMessage;
  }

  if (typeof error === 'string') {
    return error || defaultMessage;
  }

  return defaultMessage;
}

export function handleApiError(error: unknown, options: ErrorHandlerOptions = {}): ErrorHandlerResult {
  if (error instanceof ApiError) {
    const result: ErrorHandlerResult = {
      message: options.customMessage || error.userMessage || error.message,
      type: error.errorType,
      retryable: error.retryable,
      shouldRedirectToLogin: error.errorType === 'AUTH',
    };

    if (result.shouldRedirectToLogin && options.onAuthError) {
      options.onAuthError();
    }

    return result;
  }

  if (error instanceof Error) {
    if (error.message.includes('网络') || error.message.includes('Network')) {
      return {
        message: options.customMessage || '网络连接失败，请检查网络后重试',
        type: 'NETWORK',
        retryable: true,
        shouldRedirectToLogin: false,
      };
    }

    if (error.message.includes('超时') || error.message.includes('timeout')) {
      return {
        message: options.customMessage || '请求超时，请稍后重试',
        type: 'TIMEOUT',
        retryable: true,
        shouldRedirectToLogin: false,
      };
    }

    return {
      message: options.customMessage || error.message || '操作失败，请稍后重试',
      type: 'UNKNOWN',
      retryable: true,
      shouldRedirectToLogin: false,
    };
  }

  return {
    message: options.customMessage || '发生未知错误，请稍后重试',
    type: 'UNKNOWN',
    retryable: true,
    shouldRedirectToLogin: false,
  };
}

export function formatValidationError(errors: Record<string, string[]>): string {
  const messages = Object.values(errors).flat();
  return messages.length > 0 ? messages[0] : '表单校验失败';
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === 401 || error.status === 401;
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('网络') || msg.includes('econnaborted');
  }
  return false;
}

export function getErrorStyleClass(type: ErrorType): string {
  switch (type) {
    case 'AUTH':
    case 'PERMISSION':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'VALIDATION':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'CONFLICT':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'SERVER':
    case 'NETWORK':
    case 'TIMEOUT':
      return 'bg-gray-50 text-gray-800 border-gray-200';
    default:
      return 'bg-red-50 text-red-800 border-red-200';
  }
}

export function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  return true;
}

export default formatApiError;
