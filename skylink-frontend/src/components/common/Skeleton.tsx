import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : 'auto'),
    height: height || (variant === 'text' ? '1rem' : 'auto')
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-gray-200 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>
      <Skeleton variant="rounded" width={24} height={24} />
    </div>
    <div className="space-y-3">
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="70%" height={12} />
    </div>
  </div>
);

interface SkeletonFlightCardProps {
  className?: string;
}

export const SkeletonFlightCard: React.FC<SkeletonFlightCardProps> = ({ className = '' }) => (
  <div className={`p-5 rounded-2xl border border-gray-200 bg-white ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton width={80} height={20} />
      <Skeleton variant="rounded" width={100} height={32} />
    </div>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Skeleton width={60} height={28} />
        <Skeleton width={50} height={14} className="mt-1" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton width={40} height={2} />
      </div>
      <div className="flex-1 text-right">
        <Skeleton width={60} height={28} className="ml-auto" />
        <Skeleton width={50} height={14} className="ml-auto mt-1" />
      </div>
      <div className="flex-1 text-right ml-6">
        <Skeleton width={80} height={24} className="ml-auto" />
        <Skeleton width={60} height={14} className="ml-auto mt-1" />
      </div>
    </div>
  </div>
);

interface SkeletonDashboardStatsProps {
  className?: string;
}

export const SkeletonDashboardStats: React.FC<SkeletonDashboardStatsProps> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-gray-200 ${className}`}>
    <Skeleton width={120} height={20} className="mb-4" />
    <Skeleton width={80} height={36} />
    <Skeleton width={100} height={14} className="mt-2" />
  </div>
);

interface SkeletonTableRowProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  rows = 5,
  cols = 6,
  className = ''
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height={16} />
      ))}
    </div>
    {Array.from({ length: rows - 1 }).map((_, i) => (
      <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} height={14} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
