import React from 'react';

export type AdminBadgeVariant = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple';
export type AdminBadgeSize = 'sm' | 'md';

export type AdminBadgeProps = {
  children: React.ReactNode;
  variant?: AdminBadgeVariant;
  size?: AdminBadgeSize;
  dot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

const variantCls: Record<AdminBadgeVariant, string> = {
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  success: 'bg-green-50 text-green-700 border-green-100',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  danger: 'bg-red-50 text-red-700 border-red-100',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
};

const dotCls: Record<AdminBadgeVariant, string> = {
  primary: 'bg-indigo-500',
  info: 'bg-sky-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  neutral: 'bg-gray-400',
  purple: 'bg-purple-500',
};

const sizeCls: Record<AdminBadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

const cx = (...xs: Array<string | undefined | null | false>) => xs.filter(Boolean).join(' ');

const AdminBadge: React.FC<AdminBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon: Icon,
  className,
}) => {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
    >
      {dot && <span className={cx('w-1.5 h-1.5 rounded-full', dotCls[variant])} />}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
};

export default AdminBadge;
