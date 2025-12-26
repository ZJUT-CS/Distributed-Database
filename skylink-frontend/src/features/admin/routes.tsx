import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const AdminLayout = lazy(() => import('./pages/AdminLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FlightMgmt = lazy(() => import('./pages/FlightMgmt'));
const BookingsMgmt = lazy(() => import('./pages/BookingsMgmt'));
const UsersMgmt = lazy(() => import('./pages/UsersMgmt'));
const PaymentsMgmt = lazy(() => import('./pages/PaymentsMgmt'));
const AdminsMgmt = lazy(() => import('./pages/AdminsMgmt'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));
const RoutesMgmt = lazy(() => import('./pages/RoutesMgmt'));
const AircraftModelsMgmt = lazy(() => import('./pages/AircraftModelsMgmt'));
const CabinConfigsMgmt = lazy(() => import('./pages/CabinConfigsMgmt'));
const Settings = lazy(() => import('./pages/Settings'));
const OrderAudit = lazy(() => import('./pages/OrderAudit'));

export const adminRoutes: RouteObject[] = [
  {
    path: '',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'flights',
        element: <FlightMgmt />,
      },
      {
        path: 'orders',
        element: <BookingsMgmt />,
      },
      {
        path: 'orders/audit',
        element: <OrderAudit />,
      },
      {
        path: 'users',
        element: <UsersMgmt />,
      },
      {
        path: 'admins',
        element: <AdminsMgmt />,
      },
      {
        path: 'payments',
        element: <PaymentsMgmt />,
      },
      {
        path: 'system/config',
        element: <Settings />,
      },
      {
        path: 'system/logs',
        element: <SystemLogs />,
      },
      {
        path: 'routes',
        element: <RoutesMgmt />,
      },
      {
        path: 'aircraft-models',
        element: <AircraftModelsMgmt />,
      },
      {
        path: 'cabin-configs',
        element: <CabinConfigsMgmt />,
      },
    ],
  },
];
