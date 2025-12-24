/**
 * 错误处理工具函数
 * 提供统一的错误提示和处理策略
 */

import { ApiError, type ErrorType } from '@/lib/axios';

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
    /** 自定义重试回调 */
    onRetry?: () => void;
    /** 自定义认证错误回调 (跳转登录) */
    onAuthError?: () => void;
    /** 是否显示 toast 提示 */
    showToast?: boolean;
    /** 自定义错误消息 */
    customMessage?: string;
}

/**
 * 错误处理结果
 */
export interface ErrorHandlerResult {
    /** 用户友好的消息 */
    message: string;
    /** 错误类型 */
    type: ErrorType;
    /** 是否可重试 */
    retryable: boolean;
    /** 是否应跳转登录页 */
    shouldRedirectToLogin: boolean;
}

/**
 * 统一错误处理函数
 * 根据错误类型返回适当的用户提示和处理建议
 */
export function handleApiError(error: unknown, options: ErrorHandlerOptions = {}): ErrorHandlerResult {
    // 处理 ApiError
    if (error instanceof ApiError) {
        const result: ErrorHandlerResult = {
            message: options.customMessage || error.userMessage || error.message,
            type: error.errorType,
            retryable: error.retryable,
            shouldRedirectToLogin: error.errorType === 'AUTH',
        };

        // 自动处理认证错误
        if (result.shouldRedirectToLogin && options.onAuthError) {
            options.onAuthError();
        }

        return result;
    }

    // 处理普通 Error
    if (error instanceof Error) {
        // 网络错误检测
        if (error.message.includes('网络') || error.message.includes('Network')) {
            return {
                message: options.customMessage || '网络连接失败，请检查网络后重试',
                type: 'NETWORK',
                retryable: true,
                shouldRedirectToLogin: false,
            };
        }

        // 超时检测
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

    // 处理未知错误
    return {
        message: options.customMessage || '发生未知错误，请稍后重试',
        type: 'UNKNOWN',
        retryable: true,
        shouldRedirectToLogin: false,
    };
}

/**
 * 获取错误提示样式类名 (用于 Toast/Alert)
 */
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

/**
 * 判断是否应该重试请求
 */
export function shouldRetry(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.retryable;
    }
    return true; // 默认允许重试
}
