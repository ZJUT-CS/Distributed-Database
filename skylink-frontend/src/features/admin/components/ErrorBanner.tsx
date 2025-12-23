import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import AdminButton from './AdminButton';

export type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, className }) => {
  const msg = String(message || '').trim();
  if (!msg) return null;

  return (
    <div
      className={`rounded-admin border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        className ?? ''
      }`.trim()}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
        <div className="leading-5">{msg}</div>
      </div>
      {onRetry ? (
        <AdminButton variant="outline" className="h-9 px-3" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          重试
        </AdminButton>
      ) : null}
    </div>
  );
};

export default ErrorBanner;
