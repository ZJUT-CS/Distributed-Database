import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

// ===== 类型定义 =====
export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ===== 样式配置 =====
const variantConfig: Record<ConfirmVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  confirmBtnClass: string;
}> = {
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtnClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtnClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30',
  },
};

// ===== Context =====
const ConfirmContext = createContext<ConfirmContextType | null>(null);

// ===== Hook =====
export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
};

// ===== Provider =====
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    confirmText: '确认',
    cancelText: '取消',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        variant: options.variant || 'info',
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        onConfirm: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModalUI {...state} />
    </ConfirmContext.Provider>
  );
};

// ===== Modal UI =====
const ConfirmModalUI: React.FC<ConfirmState> = ({
  isOpen,
  title,
  message,
  variant = 'info',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center`}>
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 font-semibold rounded-xl shadow-lg transition-all ${config.confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModalUI;
