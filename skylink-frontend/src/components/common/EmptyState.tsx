import React from 'react';
import { Plane, Calendar, Ticket, MapPin, Search, FileText, User, AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

type EmptyStateType = 'flights' | 'bookings' | 'orders' | 'search' | 'generic' | 'error' | 'network';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'illustrated';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  size = 'md',
  variant = 'illustrated',
  className = ''
}) => {
  const typeConfig = {
    flights: {
      icon: icon || <Plane className="w-16 h-16" />,
      defaultTitle: '暂无航班信息',
      defaultDescription: '当前查询条件下没有找到航班，请尝试调整日期或目的地'
    },
    bookings: {
      icon: icon || <Ticket className="w-16 h-16" />,
      defaultTitle: '暂无预订记录',
      defaultDescription: '您还没有预订任何航班，快去搜索心仪的航班吧'
    },
    orders: {
      icon: icon || <FileText className="w-16 h-16" />,
      defaultTitle: '暂无订单',
      defaultDescription: '您还没有创建任何订单'
    },
    search: {
      icon: icon || <Search className="w-16 h-16" />,
      defaultTitle: '开始搜索航班',
      defaultDescription: '输入出发地和目的地，为您找到最合适的航班'
    },
    generic: {
      icon: icon || <AlertCircle className="w-16 h-16" />,
      defaultTitle: '暂无内容',
      defaultDescription: '当前没有可显示的内容'
    },
    error: {
      icon: icon || <AlertCircle className="w-16 h-16 text-red-500" />,
      defaultTitle: '出错了',
      defaultDescription: '加载内容时出现问题，请稍后重试'
    },
    network: {
      icon: icon || <RefreshCw className="w-16 h-16 text-amber-500" />,
      defaultTitle: '网络连接失败',
      defaultDescription: '请检查网络连接后重试'
    }
  };

  const config = typeConfig[type];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  const sizeClasses = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-12'
  };

  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
        <div className={`text-gray-400 mb-3 ${iconSizeClasses[size]}`}>
          {config.icon}
        </div>
        <p className={`font-semibold text-gray-700 ${titleSizeClasses[size]} mb-1`}>{displayTitle}</p>
        <p className={`text-gray-500 ${textSizeClasses[size]}`}>{displayDescription}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50" />
        <div className={`relative text-blue-600 ${iconSizeClasses[size]}`}>
          {config.icon}
        </div>
      </div>
      
      <h3 className={`font-bold text-gray-900 ${titleSizeClasses[size]} mb-2`}>
        {displayTitle}
      </h3>
      
      <p className={`text-gray-500 max-w-md ${textSizeClasses[size]} mb-6`}>
        {displayDescription}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="group px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="font-semibold">{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export const EmptyStateFlights: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="flights" {...props} />
);

export const EmptyStateBookings: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="bookings" {...props} />
);

export const EmptyStateOrders: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="orders" {...props} />
);

export const EmptyStateError: React.FC<Omit<EmptyStateProps, 'type' | 'actionLabel'>> = (props) => (
  <EmptyState 
    type="error" 
    actionLabel="重试"
    {...props}
  />
);

export const EmptyStateNetwork: React.FC<Omit<EmptyStateProps, 'type' | 'actionLabel'>> = (props) => (
  <EmptyState 
    type="network" 
    actionLabel="刷新"
    {...props}
  />
);

export default EmptyState;
