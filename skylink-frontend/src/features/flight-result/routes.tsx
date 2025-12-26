import React from 'react';
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const FlightResultPage = lazy(() => import('./pages/FlightResultPage'));

export const flightResultRoutes: RouteObject[] = [
  {
    path: 'results',
    element: <FlightResultPage />,
  },
];
