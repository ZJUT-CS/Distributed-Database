import { useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { logger } from '@/lib/logger';

export type AuditAction = 'view' | 'copy' | 'edit' | 'export';

export interface AuditLogEntry {
  action: AuditAction;
  fieldType: string;
  fieldName?: string;
  targetId?: string | number;
  timestamp: string;
  maskedValue?: string;
}

/**
 * 敏感数据访问审计 Hook
 * 用于记录用户对敏感字段的访问行为
 */
export function useSensitiveAudit() {
  const toast = useToast();
  const { confirm } = useConfirm();

  /**
   * 记录审计日志
   */
  const logAudit = useCallback((entry: Omit<AuditLogEntry, 'timestamp'>) => {
    const log: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // 开发环境输出到控制台
    if (import.meta.env.DEV) {
      logger.debug('[敏感数据审计]', log);
    }

    // TODO: 后续接入后端审计日志 API
    // await request.post('/api/admin/audit/sensitive', log);

    // 存储到本地（临时方案，生产环境应发送到后端）
    try {
      const existing = JSON.parse(localStorage.getItem('sensitive_audit_logs') || '[]');
      existing.push(log);
      // 只保留最近 100 条
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      localStorage.setItem('sensitive_audit_logs', JSON.stringify(existing));
    } catch (e) {
      logger.error('审计日志存储失败:', e);
    }
  }, []);

  /**
   * 创建查看敏感字段的审计回调
   */
  const createRevealAudit = useCallback((fieldType: string, targetId?: string | number, fieldName?: string) => {
    return (value: string) => {
      logAudit({
        action: 'view',
        fieldType,
        fieldName,
        targetId,
        maskedValue: value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***',
      });
    };
  }, [logAudit]);

  /**
   * 创建复制敏感字段的审计回调
   */
  const createCopyAudit = useCallback((fieldType: string, targetId?: string | number, fieldName?: string) => {
    return (value: string) => {
      logAudit({
        action: 'copy',
        fieldType,
        fieldName,
        targetId,
        maskedValue: value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***',
      });
      toast.info('已复制到剪贴板');
    };
  }, [logAudit, toast]);

  /**
   * 创建查看前的确认回调（可用于权限校验）
   */
  const createRevealConfirm = useCallback((message?: string) => {
    return async (): Promise<boolean> => {
      return confirm({
        title: '敏感信息确认',
        message: message || '确定要查看完整信息吗？此操作将被记录。',
        variant: 'warning',
        confirmText: '继续查看',
        cancelText: '取消',
      });
    };
  }, [confirm]);

  /**
   * 获取本地存储的审计日志（调试用）
   */
  const getLocalLogs = useCallback((): AuditLogEntry[] => {
    try {
      return JSON.parse(localStorage.getItem('sensitive_audit_logs') || '[]');
    } catch {
      return [];
    }
  }, []);

  /**
   * 清除本地审计日志（调试用）
   */
  const clearLocalLogs = useCallback(() => {
    localStorage.removeItem('sensitive_audit_logs');
  }, []);

  return {
    logAudit,
    createRevealAudit,
    createCopyAudit,
    createRevealConfirm,
    getLocalLogs,
    clearLocalLogs,
  };
}

export default useSensitiveAudit;
