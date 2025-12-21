import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';

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
