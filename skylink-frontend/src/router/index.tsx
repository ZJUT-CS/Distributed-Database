import React, { Suspense } from 'react';
import { createBrowserRouter, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import App from '@/App';
import { AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react';

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
// 懒加载组件 - 主站页面
// =====================
const Home = React.lazy(() => import('@/pages/Home'));
const FlightResult = React.lazy(() => import('@/pages/FlightResult'));
const Booking = React.lazy(() => import('@/pages/Booking'));
const Confirmation = React.lazy(() => import('@/pages/Booking/Confirmation'));
const ChangeFlight = React.lazy(() => import('@/pages/Booking/ChangeFlight'));

// =====================
// 懒加载组件 - 用户页面
// =====================
const Login = React.lazy(() => import('@/pages/User/Login'));
const AdminApply = React.lazy(() => import('@/pages/User/AdminApply'));
const Profile = React.lazy(() => import('@/pages/User/Profile'));
const Settings = React.lazy(() => import('@/pages/User/Settings'));
const UserCenter = React.lazy(() => import('@/pages/User/UserCenter'));
const RefundsHelp = React.lazy(() => import('@/pages/User/RefundsHelp'));

// UserBookings 需要特殊处理 (有命名导出)
const UserBookingsModule = React.lazy(() => import('@/pages/User/Bookings'));
const BookingDetailsModule = React.lazy(() =>
  import('@/pages/User/Bookings').then(m => ({ default: m.BookingDetailsPage }))
);

// =====================
// 懒加载组件 - 管理后台
// =====================
const AdminLayout = React.lazy(() => import('@/pages/Admin'));
const Dashboard = React.lazy(() => import('@/pages/Admin/Dashboard'));
const FlightMgmt = React.lazy(() => import('@/pages/Admin/FlightMgmt'));
const BookingsMgmt = React.lazy(() => import('@/pages/Admin/BookingsMgmt'));
const UsersMgmt = React.lazy(() => import('@/pages/Admin/UsersMgmt'));
const PaymentsMgmt = React.lazy(() => import('@/pages/Admin/PaymentsMgmt'));
const AdminSettings = React.lazy(() => import('@/pages/Admin/Settings'));
const OrderAudit = React.lazy(() => import('@/pages/Admin/OrderAudit'));
const AdminsMgmt = React.lazy(() => import('@/pages/Admin/AdminsMgmt'));
const SystemLogs = React.lazy(() => import('@/pages/Admin/SystemLogs'));

// =====================
// 辅助函数：包装懒加载组件
// =====================
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
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
      { index: true, element: withSuspense(Home) },
      { path: 'login', element: withSuspense(Login) },
      { path: 'admin-apply', element: withSuspense(AdminApply) },
      { path: 'results', element: withSuspense(FlightResult) },
      { path: 'booking', element: withSuspense(Booking) },
      { path: 'booking/confirmation', element: withSuspense(Confirmation) },
      { path: 'booking/change', element: withSuspense(ChangeFlight) },
      { path: 'profile', element: withSuspense(Profile) },
      { path: 'settings', element: withSuspense(Settings) },
      { path: 'my-bookings', element: withSuspense(UserBookingsModule) },
      { path: 'my-bookings/:bookingId', element: withSuspense(BookingDetailsModule) },
      { path: 'user-center', element: withSuspense(UserCenter) },
      { path: 'refunds-help', element: withSuspense(RefundsHelp) },
    ]
  },
  {
    path: '/admin',
    errorElement: <ErrorPage />,
    element: withSuspense(AdminLayout),
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: 'flights', element: withSuspense(FlightMgmt) },
      { path: 'orders', element: withSuspense(BookingsMgmt) },
      { path: 'orders/audit', element: withSuspense(OrderAudit) },
      { path: 'users', element: withSuspense(UsersMgmt) },
      { path: 'admins', element: withSuspense(AdminsMgmt) },
      { path: 'payments', element: withSuspense(PaymentsMgmt) },
      { path: 'system/config', element: withSuspense(AdminSettings) },
      { path: 'system/logs', element: withSuspense(SystemLogs) },
    ]
  }
]);
