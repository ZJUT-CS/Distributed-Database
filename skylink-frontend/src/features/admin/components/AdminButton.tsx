import React from 'react';

type AdminButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'gradient-primary' | 'gradient-purple' | 'gradient-indigo';

export type AdminButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
};

const variantClassName = (variant: AdminButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'bg-admin-primary hover:bg-admin-primary-hover text-white shadow-admin';
    case 'gradient-primary':
      return 'bg-admin-gradient-primary hover:opacity-95 text-white shadow-admin-md';
    case 'gradient-purple':
      return 'bg-admin-gradient-purple hover:opacity-95 text-white shadow-admin-md';
    case 'gradient-indigo':
      return 'bg-admin-gradient-indigo hover:opacity-95 text-white shadow-admin-md';
    case 'outline':
      return 'bg-admin-surface hover:bg-admin-bg text-admin-text border border-admin-border shadow-admin';
    case 'danger':
      return 'bg-admin-danger hover:bg-admin-danger-hover text-white shadow-admin-md';
    case 'ghost':
      return 'bg-transparent hover:bg-admin-bg text-admin-text';
    default:
      return 'bg-admin-primary hover:bg-admin-primary-hover text-white shadow-admin';
  }
};

const AdminButton: React.FC<AdminButtonProps> = ({ variant = 'primary', className, type, disabled, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-admin font-semibold text-sm transition-colors duration-150 ease-out active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
  const cls = `${base} ${variantClassName(variant)} ${className ?? ''}`.trim();

  return <button type={type ?? 'button'} disabled={disabled} className={cls} {...rest} />;
};

export default AdminButton;

