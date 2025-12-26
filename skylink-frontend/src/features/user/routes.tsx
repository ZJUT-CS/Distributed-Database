import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const UserCenterPage = lazy(() => import('./pages/UserCenterPage'));
const RefundsHelpPage = lazy(() => import('./pages/RefundsHelpPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage').then(m => ({ default: m.BookingDetailsPage })));

export const userRoutes: RouteObject[] = [
  { path: 'user-center', element: <UserCenterPage /> },
  { path: 'refunds-help', element: <RefundsHelpPage /> },
  { path: 'my-bookings', element: <BookingsPage /> },
  { path: 'my-bookings/:bookingId', element: <BookingDetailsPage /> },
];
