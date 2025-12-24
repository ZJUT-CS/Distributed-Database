import { ApiError } from '@/lib/axios';

/**
 * API 错误格式化工具
 * 统一将各种错误转为用户友好的消息
 */

// 业务错误码映射（与后端 ResultCodeEnum 对应）
const ERROR_CODE_MESSAGES: Record<number, string> = {
  // 通用错误
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '无权限执行此操作',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  
  // 业务错误码
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

// HTTP 状态码默认消息
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

export interface FormatErrorOptions {
  /** 默认消息（当无法识别错误时使用） */
  defaultMessage?: string;
  /** 是否显示错误码 */
  showCode?: boolean;
  /** 是否显示 RequestId（便于排查） */
  showRequestId?: boolean;
}

/**
 * 格式化 API 错误为用户友好消息
 */
export function formatApiError(
  error: unknown,
  options: FormatErrorOptions = {}
): string {
  const {
    defaultMessage = '操作失败，请稍后重试',
    showCode = false,
    showRequestId = false,
  } = options;

  // ApiError 实例
  if (error instanceof ApiError) {
    let message = error.message;
    
    // 优先使用后端返回的消息
    if (!message || message === '请求失败') {
      // 尝试从业务错误码获取消息
      if (error.code && ERROR_CODE_MESSAGES[error.code]) {
        message = ERROR_CODE_MESSAGES[error.code];
      }
      // 尝试从 HTTP 状态码获取消息
      else if (error.status && HTTP_STATUS_MESSAGES[error.status]) {
        message = HTTP_STATUS_MESSAGES[error.status];
      }
      else {
        message = defaultMessage;
      }
    }

    // 附加错误码
    if (showCode && error.code) {
      message = `${message}（错误码: ${error.code}）`;
    }

    // 附加 RequestId
    if (showRequestId && error.requestId) {
      message = `${message}（请求ID: ${error.requestId}）`;
    }

    return message;
  }

  // 标准 Error 实例
  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes('Network') || error.message.includes('网络')) {
      return '网络连接失败，请检查网络';
    }
    // 超时错误
    if (error.message.includes('timeout') || error.message.includes('超时')) {
      return '请求超时，请稍后重试';
    }
    return error.message || defaultMessage;
  }

  // 字符串错误
  if (typeof error === 'string') {
    return error || defaultMessage;
  }

  // 其他未知错误
  return defaultMessage;
}

/**
 * 格式化表单校验错误
 */
export function formatValidationError(errors: Record<string, string[]>): string {
  const messages = Object.values(errors).flat();
  return messages.length > 0 ? messages[0] : '表单校验失败';
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === 401 || error.status === 401;
  }
  return false;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('网络') || msg.includes('econnaborted');
  }
  return false;
}

export default formatApiError;
