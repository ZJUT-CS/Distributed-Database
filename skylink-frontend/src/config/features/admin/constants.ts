import { LucideIcon, Clock, CheckCircle, XCircle, AlertCircle, Ban, RefreshCw, Wallet, CreditCard, Shield, ShieldCheck, User, Activity, AlertTriangle, FileText, LogIn } from 'lucide-react';

export interface StatusMeta {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  icon?: LucideIcon;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export const ORDER_STATUS = {
  PENDING_AUDIT: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  REJECTED: 3,
  PROCESSING: 4,
  REFUNDED: 5,
  CANCELLED: 6,
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

export const USER_STATUS = {
  ACTIVE: 1,
  DISABLED: 0,
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

export const GENDER = {
  MALE: 1,
  FEMALE: 2,
} as const;

export const GENDER_MAP: Record<number, string> = {
  [GENDER.MALE]: '男',
  [GENDER.FEMALE]: '女',
};

export const GENDER_OPTIONS = [
  { value: '', label: '请选择' },
  { value: GENDER.MALE, label: '男' },
  { value: GENDER.FEMALE, label: '女' },
];

export const FLIGHT_STATUS = {
  ACTIVE: 1,
  CANCELLED: 2,
  DELAYED: 3,
} as const;

export const FLIGHT_STATUS_META: Record<number, StatusMeta> = {
  [FLIGHT_STATUS.ACTIVE]: { label: '计划中', variant: 'success', icon: CheckCircle },
  [FLIGHT_STATUS.CANCELLED]: { label: '已取消', variant: 'danger', icon: Ban },
  [FLIGHT_STATUS.DELAYED]: { label: '延误', variant: 'warning', icon: Clock },
};

export const FLIGHT_STATUS_MAP = FLIGHT_STATUS_META;

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

export const PAYMENT_STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  REFUNDING: 3,
  REFUNDED: 4,
} as const;

export const PAYMENT_STATUS_META: Record<number, StatusMeta> = {
  [PAYMENT_STATUS.PENDING]: { label: '待支付', variant: 'warning', icon: Clock },
  [PAYMENT_STATUS.SUCCESS]: { label: '已支付', variant: 'success', icon: CheckCircle },
  [PAYMENT_STATUS.FAILED]: { label: '支付失败', variant: 'danger', icon: XCircle },
  [PAYMENT_STATUS.REFUNDING]: { label: '退款中', variant: 'info', icon: RefreshCw },
  [PAYMENT_STATUS.REFUNDED]: { label: '已退款', variant: 'primary', icon: Wallet },
};

export const PAYMENT_STATUS_MAP = PAYMENT_STATUS_META;

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: PAYMENT_STATUS.PENDING, label: '待支付' },
  { value: PAYMENT_STATUS.SUCCESS, label: '已支付' },
  { value: PAYMENT_STATUS.FAILED, label: '支付失败' },
  { value: PAYMENT_STATUS.REFUNDING, label: '退款中' },
  { value: PAYMENT_STATUS.REFUNDED, label: '已退款' },
];

export const PAYMENT_METHOD = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CARD: 'card',
} as const;

export const PAYMENT_METHOD_META: Record<string, StatusMeta> = {
  [PAYMENT_METHOD.WECHAT]: { label: '微信支付', variant: 'success', icon: Wallet },
  [PAYMENT_METHOD.ALIPAY]: { label: '支付宝', variant: 'primary', icon: CreditCard },
  [PAYMENT_METHOD.CARD]: { label: '银行卡', variant: 'info', icon: CreditCard },
};

export const PAYMENT_METHOD_MAP = PAYMENT_METHOD_META;

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

export const CHANGE_REQUEST_TYPE = {
  REFUND: 1,
  CHANGE: 2,
} as const;

export const CHANGE_REQUEST_TYPE_META: Record<number, StatusMeta> = {
  [CHANGE_REQUEST_TYPE.REFUND]: { label: '退票', variant: 'warning', icon: Wallet },
  [CHANGE_REQUEST_TYPE.CHANGE]: { label: '改签', variant: 'info', icon: RefreshCw },
};

export const CHANGE_REQUEST_TYPE_MAP = CHANGE_REQUEST_TYPE_META;

export const CHANGE_REQUEST_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

export const CHANGE_REQUEST_STATUS_META: Record<number, StatusMeta> = {
  [CHANGE_REQUEST_STATUS.PENDING]: { label: '待审核', variant: 'warning', icon: Clock },
  [CHANGE_REQUEST_STATUS.APPROVED]: { label: '已通过', variant: 'success', icon: CheckCircle },
  [CHANGE_REQUEST_STATUS.REJECTED]: { label: '已拒绝', variant: 'danger', icon: XCircle },
};

export const CHANGE_REQUEST_STATUS_MAP = CHANGE_REQUEST_STATUS_META;
