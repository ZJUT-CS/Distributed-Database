import React, { Suspense } from 'react';
import { createBrowserRouter, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import App from '@/App';
import { AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react';
import { homeRoutes } from '@/features/home/routes';
import { flightResultRoutes } from '@/features/flight/routes';
import { authRoutes } from '@/features/auth/routes';
import { adminRoutes } from '@/features/admin/routes';
import { bookingRoutes } from '@/features/booking/routes';
import { userRoutes } from '@/features/user/routes';

// =====================
// 错误边界组件
// =====================
const ErrorPage: React.FC = () => {
  const error = useRouteError();

  let statusCode = 500;
  let title = '哎呀，出错了！';
  let message = '发生了未知错误，请稍后重试。';

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 404) {
      title = '页面未找到';
      message = '您访问的页面不存在或已被移除。';
    } else if (error.status === 403) {
      title = '访问被拒绝';
      message = '您没有权限访问此页面。';
    } else {
      message = `${error.status} ${error.statusText}`;
    }
  } else if (error instanceof Error) {
    // 懒加载失败或组件代码报错
    if (error.message.includes('Failed to fetch') || error.message.includes('Loading chunk')) {
      title = '加载失败';
      message = '网络连接不稳定，请检查网络后重试。';
    } else {
      message = error.message;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-center px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Status Code */}
        <div className="text-7xl font-extrabold text-slate-200 mb-2">{statusCode}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>

        {/* Message */}
        <p className="text-slate-600 mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            刷新重试
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all border border-slate-200"
          >
            <HomeIcon className="w-4 h-4" />
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
};

// =====================
// Loading 组件
// =====================
const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-500 text-sm">加载中...</span>
    </div>
  </div>
);

// =====================
// 懒加载组件 - 管理后台布局
// =====================
const AdminLayout = React.lazy(() => import('@/features/admin/pages/AdminLayout'));

// =====================
// 辅助函数：包装懒加载组件
// =====================
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType> | React.ReactElement) => (
  <Suspense fallback={<PageLoading />}>
    {React.isValidElement(Component) ? Component : React.createElement(Component as React.LazyExoticComponent<React.ComponentType>)}
  </Suspense>
);

// =====================
// 路由配置
// =====================
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      ...homeRoutes.map(route => ({ ...route, element: withSuspense(route.element as any) })),
      { path: 'results', ...flightResultRoutes[0], element: withSuspense(flightResultRoutes[0].element as any) },
      ...authRoutes.map(route => ({ ...route, element: withSuspense(route.element as any) })),
      ...bookingRoutes.map(route => ({ ...route, element: withSuspense(route.element as any) })),
      ...userRoutes.map(route => ({ ...route, element: withSuspense(route.element as any) })),
    ]
  },
  {
    path: '/admin',
    errorElement: <ErrorPage />,
    element: withSuspense(AdminLayout),
    children: [
      ...adminRoutes[0].children!.map(route => ({ ...route, element: withSuspense(route.element as any) })),
    ]
  }
]);
