import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminApplyPage = lazy(() => import('./pages/AdminApplyPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export const authRoutes: RouteObject[] = [
    { path: 'login', element: <LoginPage /> },
    { path: 'admin-apply', element: <AdminApplyPage /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'settings', element: <SettingsPage /> },
];
