import React from 'react';

type AdminButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'gradient-primary' | 'gradient-purple' | 'gradient-indigo';

export type AdminButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
};

const variantClassName = (variant: AdminButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm';
    case 'gradient-primary':
      return 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:opacity-95 text-white shadow-md';
    case 'gradient-purple':
      return 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:opacity-95 text-white shadow-md';
    case 'gradient-indigo':
      return 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white shadow-md';
    case 'outline':
      return 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white shadow-md';
    case 'ghost':
      return 'bg-transparent hover:bg-gray-50 text-gray-700';
    default:
      return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm';
  }
};

const AdminButton: React.FC<AdminButtonProps> = ({ variant = 'primary', className, type, disabled, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm transition-colors duration-150 ease-out active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
  const cls = `${base} ${variantClassName(variant)} ${className ?? ''}`.trim();

  return <button type={type ?? 'button'} disabled={disabled} className={cls} {...rest} />;
};

export default AdminButton;

