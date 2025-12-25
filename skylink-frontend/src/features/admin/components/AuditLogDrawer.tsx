import React, { useMemo } from 'react';
import { Clock, User, Edit, Plus, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import AdminDrawer from './AdminDrawer';
import AdminBadge from './AdminBadge';

export type AuditActionType = 'create' | 'update' | 'delete' | 'cancel' | 'confirm' | 'refund' | 'change' | 'login' | 'logout';

export interface AuditChange {
  field: string;
  label?: string;
  before?: any;
  after?: any;
}

export interface AuditLogItem {
  id: string;
  operatorId: string;
  operatorName: string;
  entityType: string;
  entityId: string;
  action: AuditActionType;
  actionLabel?: string;
  changes?: AuditChange[];
  description?: string;
  ip?: string;
  timestamp: string;
}

export interface AuditLogDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  logs: AuditLogItem[];
  loading?: boolean;
}

const actionConfig: Record<AuditActionType, { label: string; icon: any; variant: 'primary' | 'success' | 'danger' | 'warning' | 'neutral' }> = {
  create: { label: '创建', icon: Plus, variant: 'success' },
  update: { label: '修改', icon: Edit, variant: 'primary' },
  delete: { label: '删除', icon: Trash2, variant: 'danger' },
  cancel: { label: '取消', icon: XCircle, variant: 'danger' },
  confirm: { label: '确认', icon: CheckCircle, variant: 'success' },
  refund: { label: '退款', icon: FileText, variant: 'warning' },
  change: { label: '变更', icon: Edit, variant: 'primary' },
  login: { label: '登录', icon: User, variant: 'neutral' },
  logout: { label: '退出', icon: User, variant: 'neutral' },
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (val: any): string => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? '是' : '否';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  open,
  onClose,
  title = '操作日志',
  subtitle,
  logs = [],
  loading = false,
}) => {
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  const isEmpty = sortedLogs.length === 0 && !loading;

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">暂无操作记录</p>
            <p className="text-sm text-gray-400 mt-1">该实体尚未有任何操作历史</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log, index) => {
              const config = actionConfig[log.action] || { label: log.actionLabel || log.action, icon: FileText, variant: 'neutral' };
              const ActionIcon = config.icon;

              return (
                <div
                  key={log.id || index}
                  className="relative pl-8 pb-6 last:pb-0 group"
                >
                  {index !== sortedLogs.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-100 group-last:hidden"></div>
                  )}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shadow-sm">
                    <ActionIcon className="w-3 h-3 text-indigo-500" />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AdminBadge size="sm" variant={config.variant}>
                          {config.label}
                        </AdminBadge>
                        <span className="text-sm text-gray-500">
                          {log.operatorName || `管理员#${log.operatorId}`}
                        </span>
                        {log.ip && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {log.ip}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(log.timestamp)}
                      </div>
                    </div>

                    {log.description && (
                      <p className="text-sm text-gray-600 mb-3">{log.description}</p>
                    )}

                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">变更详情</div>
                        <div className="space-y-2">
                          {log.changes.map((change, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-400 min-w-[60px]">{change.label || change.field}:</span>
                              <span className="line-through text-red-400 opacity-60">
                                {formatValue(change.before)}
                              </span>
                              <span className="text-gray-300">→</span>
                              <span className="text-green-600 font-medium">
                                {formatValue(change.after)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminDrawer>
  );
};

export default AuditLogDrawer;
