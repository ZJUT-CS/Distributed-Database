/**
 * 管理后台统一枚举常量
 * 集中管理各类状态映射、类型定义，避免魔法数字散落各处
 * 
 * ⚠️ 重要：所有枚举值必须与后端保持一致
 * 后端参考：skylink-backend/src/main/java/com/team/skylink/common/enums/
 */

import { LucideIcon, Clock, CheckCircle, XCircle, AlertCircle, Ban, RefreshCw, Wallet, CreditCard, Shield, ShieldCheck, User, Activity, AlertTriangle, FileText, LogIn } from 'lucide-react';

// ==================== 通用 Meta 类型 ====================
export interface StatusMeta {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  icon?: LucideIcon;
}

// ==================== 订单状态 ====================
// 对应后端：OrderStatusEnum.java
export const ORDER_STATUS = {
  PENDING_AUDIT: 0,     // 待审核
  PENDING_PAYMENT: 1,   // 待支付
  CONFIRMED: 2,         // 已支付
  REJECTED: 3,          // 已拒绝
  PROCESSING: 4,        // 改签处理中
  REFUNDED: 5,          // 已退票
  CANCELLED: 6,         // 已取消
} as const;

export const ORDER_STATUS_META: Record<number, StatusMeta> = {
  [ORDER_STATUS.PENDING_AUDIT]: { label: '待审核', variant: 'warning', icon: Clock },
  [ORDER_STATUS.PENDING_PAYMENT]: { label: '待支付', variant: 'warning', icon: CreditCard },
  [ORDER_STATUS.CONFIRMED]: { label: '已支付', variant: 'success', icon: CheckCircle },
  [ORDER_STATUS.REJECTED]: { label: '已拒绝', variant: 'danger', icon: XCircle },
  [ORDER_STATUS.PROCESSING]: { label: '改签处理中', variant: 'info', icon: RefreshCw },
  [ORDER_STATUS.REFUNDED]: { label: '已退票', variant: 'info', icon: Wallet },
  [ORDER_STATUS.CANCELLED]: { label: '已取消', variant: 'danger', icon: Ban },
};

// 兼容旧版 MAP（等价于 META）
export const ORDER_STATUS_MAP = ORDER_STATUS_META;

export const ORDER_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: ORDER_STATUS.PENDING_AUDIT, label: '待审核' },
  { value: ORDER_STATUS.PENDING_PAYMENT, label: '待支付' },
  { value: ORDER_STATUS.CONFIRMED, label: '已支付' },
  { value: ORDER_STATUS.REJECTED, label: '已拒绝' },
  { value: ORDER_STATUS.PROCESSING, label: '改签处理中' },
  { value: ORDER_STATUS.REFUNDED, label: '已退票' },
  { value: ORDER_STATUS.CANCELLED, label: '已取消' },
];

// ==================== 用户状态 ====================
export const USER_STATUS = {
  ACTIVE: 1,     // 正常
  DISABLED: 0,   // 禁用
} as const;

export const USER_STATUS_META: Record<number, StatusMeta> = {
  [USER_STATUS.ACTIVE]: { label: '正常', variant: 'success', icon: CheckCircle },
  [USER_STATUS.DISABLED]: { label: '禁用', variant: 'danger', icon: Ban },
};

export const USER_STATUS_MAP = USER_STATUS_META;

export const USER_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: USER_STATUS.ACTIVE, label: '正常' },
  { value: USER_STATUS.DISABLED, label: '禁用' },
];

// ==================== 航班状态 ====================
export const FLIGHT_STATUS = {
  ACTIVE: 1,     // 计划中
  CANCELLED: 2,  // 已取消
  DELAYED: 3,    // 延误
} as const;

export const FLIGHT_STATUS_META: Record<number, StatusMeta> = {
  [FLIGHT_STATUS.ACTIVE]: { label: '计划中', variant: 'success', icon: CheckCircle },
  [FLIGHT_STATUS.CANCELLED]: { label: '已取消', variant: 'danger', icon: Ban },
  [FLIGHT_STATUS.DELAYED]: { label: '延误', variant: 'warning', icon: Clock },
};

export const FLIGHT_STATUS_MAP = FLIGHT_STATUS_META;

// 字符串 key 版本（用于 UI 展示）
export const FLIGHT_STATUS_STR_META: Record<string, StatusMeta> = {
  active: { label: '计划中', variant: 'success', icon: CheckCircle },
  cancelled: { label: '已取消', variant: 'danger', icon: Ban },
  delayed: { label: '延误', variant: 'warning', icon: Clock },
};

export const FLIGHT_STATUS_STR_MAP = FLIGHT_STATUS_STR_META;

export const FLIGHT_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '计划中' },
  { value: 'delayed', label: '延误' },
  { value: 'cancelled', label: '已取消' },
];

// ==================== 支付类型 ====================
export const PAYMENT_TYPE = {
  PAYMENT: 'payment',
  REFUND: 'refund',
} as const;

export const PAYMENT_TYPE_META: Record<string, StatusMeta> = {
  [PAYMENT_TYPE.PAYMENT]: { label: '支付', variant: 'primary', icon: CreditCard },
  [PAYMENT_TYPE.REFUND]: { label: '退款', variant: 'warning', icon: Wallet },
};

export const PAYMENT_TYPE_MAP = PAYMENT_TYPE_META;

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: PAYMENT_TYPE.PAYMENT, label: '支付' },
  { value: PAYMENT_TYPE.REFUND, label: '退款' },
];

// ==================== 支付状态 ====================
export const PAYMENT_STATUS = {
  SUCCESS: 'success',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;

export const PAYMENT_STATUS_META: Record<string, StatusMeta> = {
  [PAYMENT_STATUS.SUCCESS]: { label: '成功', variant: 'success', icon: CheckCircle },
  [PAYMENT_STATUS.PENDING]: { label: '处理中', variant: 'warning', icon: Clock },
  [PAYMENT_STATUS.FAILED]: { label: '失败', variant: 'danger', icon: XCircle },
};

export const PAYMENT_STATUS_MAP = PAYMENT_STATUS_META;

// ==================== 管理员角色 ====================
export const ADMIN_ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
} as const;

export const ADMIN_ROLE_META: Record<string, StatusMeta> = {
  [ADMIN_ROLE.SUPER_ADMIN]: { label: '超级管理员', variant: 'danger', icon: ShieldCheck },
  [ADMIN_ROLE.ADMIN]: { label: '管理员', variant: 'primary', icon: Shield },
  [ADMIN_ROLE.OPERATOR]: { label: '运营', variant: 'info', icon: User },
};

export const ADMIN_ROLE_MAP = ADMIN_ROLE_META;

// ==================== 日志类型 ====================
export const LOG_TYPE = {
  LOGIN: 'login',
  OPERATION: 'operation',
  SYSTEM: 'system',
  ERROR: 'error',
} as const;

export const LOG_TYPE_META: Record<string, StatusMeta> = {
  [LOG_TYPE.LOGIN]: { label: '登录', variant: 'success', icon: LogIn },
  [LOG_TYPE.OPERATION]: { label: '操作', variant: 'primary', icon: Activity },
  [LOG_TYPE.SYSTEM]: { label: '系统', variant: 'info', icon: FileText },
  [LOG_TYPE.ERROR]: { label: '错误', variant: 'danger', icon: AlertTriangle },
};

export const LOG_TYPE_MAP = LOG_TYPE_META;

export const LOG_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: LOG_TYPE.LOGIN, label: '登录' },
  { value: LOG_TYPE.OPERATION, label: '操作' },
  { value: LOG_TYPE.SYSTEM, label: '系统' },
  { value: LOG_TYPE.ERROR, label: '错误' },
];

// ==================== 退改签类型 ====================
export const CHANGE_REQUEST_TYPE = {
  REFUND: 1,    // 退票
  CHANGE: 2,    // 改签
} as const;

export const CHANGE_REQUEST_TYPE_META: Record<number, StatusMeta> = {
  [CHANGE_REQUEST_TYPE.REFUND]: { label: '退票', variant: 'warning', icon: Wallet },
  [CHANGE_REQUEST_TYPE.CHANGE]: { label: '改签', variant: 'info', icon: RefreshCw },
};

export const CHANGE_REQUEST_TYPE_MAP = CHANGE_REQUEST_TYPE_META;

// ==================== 退改签状态 ====================
export const CHANGE_REQUEST_STATUS = {
  PENDING: 0,    // 待审核
  APPROVED: 1,   // 已通过
  REJECTED: 2,   // 已拒绝
} as const;

export const CHANGE_REQUEST_STATUS_META: Record<number, StatusMeta> = {
  [CHANGE_REQUEST_STATUS.PENDING]: { label: '待审核', variant: 'warning', icon: Clock },
  [CHANGE_REQUEST_STATUS.APPROVED]: { label: '已通过', variant: 'success', icon: CheckCircle },
  [CHANGE_REQUEST_STATUS.REJECTED]: { label: '已拒绝', variant: 'danger', icon: XCircle },
};

export const CHANGE_REQUEST_STATUS_MAP = CHANGE_REQUEST_STATUS_META;
