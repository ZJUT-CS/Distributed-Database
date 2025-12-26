import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false, size = 'md' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const sizeClasses = {
        sm: 'p-6',
        md: 'p-8',
        lg: 'p-12',
      };

      const iconSizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20',
      };

      const titleSizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
      };

      const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      };

      return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 ${sizeClasses[size]}`}>
          <div className="relative max-w-lg w-full mx-auto text-center">
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-red-200 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-40" />
            
            <div className="relative bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-500/10 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-8">
                <div className={`mx-auto ${iconSizeClasses[size]} rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center`}>
                  <AlertTriangle className={`text-white ${iconSizeClasses[size]} p-2`} />
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <h2 className={`font-bold text-gray-900 ${titleSizeClasses[size]} mb-3`}>
                  哎呀，出错了
                </h2>
                
                <p className={`text-gray-600 ${textSizeClasses[size]} mb-6`}>
                  很抱歉，页面遇到了意外问题。我们已经记录了错误信息，您可以尝试刷新页面或返回首页。
                </p>
                
                {(showDetails || process.env.NODE_ENV === 'development') && error && (
                  <details className="mb-6 text-left">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors">
                      <Bug className="w-4 h-4" />
                      查看错误详情
                    </summary>
                    <div className="mt-3 p-4 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-auto max-h-48">
                      <div className="text-red-400 mb-2">{error.name}: {error.message}</div>
                      <div className="text-gray-400 whitespace-pre-wrap">{error.stack}</div>
                      {errorInfo && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-blue-400 mb-1">Component Stack:</div>
                          <div className="text-gray-400 whitespace-pre-wrap">{errorInfo.componentStack}</div>
                        </div>
                      )}
                    </div>
                  </details>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-600 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新加载
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    <Home className="w-4 h-4" />
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
