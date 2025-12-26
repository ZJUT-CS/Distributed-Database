import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));

export const homeRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
];
