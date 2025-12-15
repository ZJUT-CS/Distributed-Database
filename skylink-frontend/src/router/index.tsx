import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import FlightResult from '../pages/FlightResult';
import Booking from '../pages/Booking';
import Confirmation from '../pages/Booking/Confirmation';
import Login from '../pages/User/Login';
import AdminApply from '../pages/User/AdminApply';
import Profile from '../pages/User/Profile';
import Settings from '../pages/User/Settings';
import UserBookings from '../pages/User/Bookings';

import AdminLayout from '../pages/Admin';
import Dashboard from '../pages/Admin/Dashboard';
import FlightMgmt from '../pages/Admin/FlightMgmt';
import BookingsMgmt from '../pages/Admin/BookingsMgmt';
import UsersMgmt from '../pages/Admin/UsersMgmt';
import PaymentsMgmt from '../pages/Admin/PaymentsMgmt';
import AdminSettings from '../pages/Admin/Settings';

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
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'my-bookings', element: <UserBookings /> },
    ]
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'flights', element: <FlightMgmt /> },
      { path: 'bookings', element: <BookingsMgmt /> },
      { path: 'users', element: <UsersMgmt /> },
      { path: 'payments', element: <PaymentsMgmt /> },
      { path: 'settings', element: <AdminSettings /> },
    ]
  }
]);
