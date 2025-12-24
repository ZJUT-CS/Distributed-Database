import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
    const ctx = React.useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};

const toastConfig: Record<ToastType, {
    icon: typeof CheckCircle;
    bgClass: string;
    iconClass: string;
    borderClass: string;
}> = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-emerald-50',
        iconClass: 'text-emerald-500',
        borderClass: 'border-emerald-200',
    },
    error: {
        icon: XCircle,
        bgClass: 'bg-red-50',
        iconClass: 'text-red-500',
        borderClass: 'border-red-200',
    },
    warning: {
        icon: AlertCircle,
        bgClass: 'bg-amber-50',
        iconClass: 'text-amber-500',
        borderClass: 'border-amber-200',
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-50',
        iconClass: 'text-blue-500',
        borderClass: 'border-blue-200',
    },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = React.useState<ToastItem[]>([]);

    const showToast = React.useCallback((type: ToastType, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, message }]);

        // 自动移除
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const contextValue: ToastContextType = React.useMemo(() => ({
        showToast,
        success: (msg: string) => showToast('success', msg),
        error: (msg: string) => showToast('error', msg),
        warning: (msg: string) => showToast('warning', msg),
        info: (msg: string) => showToast('info', msg),
    }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type];
                    const Icon = config.icon;
                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${config.bgClass} ${config.borderClass} animate-slide-in-right min-w-[280px] max-w-md`}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconClass}`} />
                            <p className="flex-1 text-sm font-medium text-gray-700">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
