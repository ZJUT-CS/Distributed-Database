import React from 'react';
import { X } from 'lucide-react';

export type AdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** 渐变色主题 */
  theme?: 'indigo-purple' | 'blue-indigo' | 'purple-pink' | 'emerald-teal' | 'sky-blue';
  /** 模态框最大宽度 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
};

const themeGradient: Record<string, string> = {
  'indigo-purple': 'from-indigo-600 to-purple-600',
  'blue-indigo': 'from-blue-600 to-indigo-600',
  'purple-pink': 'from-purple-600 to-pink-600',
  'emerald-teal': 'from-emerald-600 to-teal-600',
  'sky-blue': 'from-sky-500 to-blue-500',
};

const maxWidthCls: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  theme = 'indigo-purple',
  maxWidth = 'md',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthCls[maxWidth]} overflow-hidden animate-scale-in max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${themeGradient[theme]} px-6 py-4 flex items-center justify-between flex-shrink-0`}
        >
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default AdminModal;
