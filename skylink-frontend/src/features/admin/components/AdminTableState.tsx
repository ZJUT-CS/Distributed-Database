import React from 'react';
import { AlertCircle, LucideIcon } from 'lucide-react';
import TableSkeleton from './TableSkeleton';
import EmptyState from './EmptyState';

export interface AdminTableStateProps {
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 数据是否为空 */
  isEmpty: boolean;
  /** 重试回调（错误时显示） */
  onRetry?: () => void;
  /** 骨架屏行数 */
  skeletonRows?: number;
  /** 骨架屏列数 */
  skeletonColumns?: number;
  /** 空状态图标 */
  emptyIcon?: LucideIcon;
  /** 空状态标题 */
  emptyTitle?: string;
  /** 空状态描述 */
  emptyDescription?: string;
  /** 空状态操作按钮文案 */
  emptyActionText?: string;
  /** 空状态操作回调 */
  onEmptyAction?: () => void;
  /** 有数据时渲染的内容 */
  children: React.ReactNode;
}

/**
 * 管理列表三态包装组件
 * 统一处理 loading / error / empty / data 状态
 */
const AdminTableState: React.FC<AdminTableStateProps> = ({
  loading,
  error,
  isEmpty,
  onRetry,
  skeletonRows = 5,
  skeletonColumns = 6,
  emptyIcon,
  emptyTitle = '暂无数据',
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  children,
}) => {
  // 加载中
  if (loading) {
    return <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />;
  }

  // 错误状态
  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="加载失败"
        description={error}
        actionText="重试"
        onAction={onRetry}
      />
    );
  }

  // 空数据
  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    );
  }

  // 正常渲染数据
  return <>{children}</>;
};

export default AdminTableState;
