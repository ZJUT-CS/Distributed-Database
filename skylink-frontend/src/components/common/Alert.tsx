import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'minimal';
  className?: string;
}

const alertConfig: Record<AlertType, {
  icon: typeof CheckCircle;
  filled: {
    bg: string;
    border: string;
    icon: string;
    title: string;
    message: string;
  };
  outlined: {
    bg: string;
    border: string;
    icon: string;
    title: string;
    message: string;
  };
  minimal: {
    bg: string;
    border: string;
    icon: string;
    title: string;
    message: string;
  };
}> = {
  success: {
    icon: CheckCircle,
    filled: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-600',
      icon: 'text-white',
      title: 'text-white',
      message: 'text-emerald-50',
    },
    outlined: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-500',
      title: 'text-emerald-900',
      message: 'text-emerald-700',
    },
    minimal: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      icon: 'text-emerald-500',
      title: 'text-emerald-900',
      message: 'text-gray-600',
    },
  },
  error: {
    icon: XCircle,
    filled: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      icon: 'text-white',
      title: 'text-white',
      message: 'text-red-50',
    },
    outlined: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-900',
      message: 'text-red-700',
    },
    minimal: {
      bg: 'bg-white',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-900',
      message: 'text-gray-600',
    },
  },
  warning: {
    icon: AlertTriangle,
    filled: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      icon: 'text-white',
      title: 'text-white',
      message: 'text-amber-50',
    },
    outlined: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      title: 'text-amber-900',
      message: 'text-amber-700',
    },
    minimal: {
      bg: 'bg-white',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      title: 'text-amber-900',
      message: 'text-gray-600',
    },
  },
  info: {
    icon: Info,
    filled: {
      bg: 'bg-blue-500',
      border: 'border-blue-600',
      icon: 'text-white',
      title: 'text-white',
      message: 'text-blue-50',
    },
    outlined: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-900',
      message: 'text-blue-700',
    },
    minimal: {
      bg: 'bg-white',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-900',
      message: 'text-gray-600',
    },
  },
};

const sizeClasses = {
  sm: {
    padding: 'p-3',
    icon: 'w-4 h-4',
    title: 'text-sm',
    message: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    padding: 'p-4',
    icon: 'w-5 h-5',
    title: 'text-base',
    message: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    padding: 'p-5',
    icon: 'w-6 h-6',
    title: 'text-lg',
    message: 'text-base',
    gap: 'gap-4',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  size = 'md',
  variant = 'outlined',
  className = '',
}) => {
  const config = alertConfig[type];
  const variantConfig = config[variant];
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div className={`
      relative rounded-xl border ${variantConfig.bg} ${variantConfig.border} 
      ${sizeConfig.padding} ${sizeConfig.gap} ${className}
    `}>
      <div className="flex items-start">
        <Icon className={`${sizeConfig.icon} ${variantConfig.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`${sizeConfig.title} font-bold ${variantConfig.title} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`${sizeConfig.message} ${variantConfig.message}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${variantConfig.icon} hover:opacity-70 transition-opacity`}
          >
            <X className={sizeConfig.icon} />
          </button>
        )}
      </div>
    </div>
  );
};

export const AlertSuccess: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="success" {...props} />
);

export const AlertError: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="error" {...props} />
);

export const AlertWarning: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="warning" {...props} />
);

export const AlertInfo: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="info" {...props} />
);

export default Alert;
