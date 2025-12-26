import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const BookingPage = lazy(() => import('./pages/BookingPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const ChangeFlightPage = lazy(() => import('./pages/ChangeFlightPage'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));

export const bookingRoutes: RouteObject[] = [
  { path: 'booking', element: <BookingPage /> },
  { path: 'booking/confirmation', element: <ConfirmationPage /> },
  { path: 'booking/change', element: <ChangeFlightPage /> },
  { path: 'booking/seat-selection', element: <SeatSelectionPage /> },
];
