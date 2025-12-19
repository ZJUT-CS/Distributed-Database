import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import FlightResult from '../pages/FlightResult';
import Booking from '../pages/Booking';
import Confirmation from '../pages/Booking/Confirmation';
import ChangeFlight from '../pages/Booking/ChangeFlight';
import Login from '../pages/User/Login';
import AdminApply from '../pages/User/AdminApply';
import Profile from '../pages/User/Profile';
import Settings from '../pages/User/Settings';
import UserBookings, { BookingDetailsPage } from '../pages/User/Bookings';
import UserCenter from '../pages/User/UserCenter';
import RefundsHelp from '../pages/User/RefundsHelp';

import AdminLayout from '../pages/Admin';
import Dashboard from '../pages/Admin/Dashboard';
import FlightMgmt from '../pages/Admin/FlightMgmt';
import BookingsMgmt from '../pages/Admin/BookingsMgmt';
import UsersMgmt from '../pages/Admin/UsersMgmt';
import PaymentsMgmt from '../pages/Admin/PaymentsMgmt';
import AdminSettings from '../pages/Admin/Settings';
import OrderAudit from '../pages/Admin/OrderAudit';
import AdminsMgmt from '../pages/Admin/AdminsMgmt';
import SystemLogs from '../pages/Admin/SystemLogs';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'admin-apply', element: <AdminApply /> },
      { path: 'results', element: <FlightResult /> },
      { path: 'booking', element: <Booking /> },
      { path: 'booking/confirmation', element: <Confirmation /> },
      { path: 'booking/change', element: <ChangeFlight /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'my-bookings', element: <UserBookings /> },
      { path: 'my-bookings/:bookingId', element: <BookingDetailsPage /> },
      { path: 'user-center', element: <UserCenter /> },
      { path: 'refunds-help', element: <RefundsHelp /> },
    ]
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'flights', element: <FlightMgmt /> },
      { path: 'orders', element: <BookingsMgmt /> },
      { path: 'orders/audit', element: <OrderAudit /> },
      { path: 'users', element: <UsersMgmt /> },
      { path: 'admins', element: <AdminsMgmt /> },
      { path: 'payments', element: <PaymentsMgmt /> },
      { path: 'system/config', element: <AdminSettings /> },
      { path: 'system/logs', element: <SystemLogs /> },
    ]
  }
]);
