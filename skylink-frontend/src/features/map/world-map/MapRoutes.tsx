import React from 'react';
import type { MapPoint } from '@/features/flight';
import type { MapRoute } from '../WorldMap';
import { buildArcPath } from './utils/arcUtils';
import { project } from './geometry';

interface MapRoutesProps {
  routes: MapRoute[];
  points: MapPoint[];
  isDragging: boolean;
  isDark: boolean;
  colors: {
    routeStroke: string;
    planeFill: string;
  };
}

export const MapRoutes: React.FC<MapRoutesProps> = ({ routes, points, isDragging, isDark, colors }) => {
  return (
    <>
      {routes.map((route, idx) => {
        const startPoint = points.find((p) => p.id === route.from);
        const endPoint = points.find((p) => p.id === route.to);
        if (!startPoint || !endPoint) return null;

        const start = project(startPoint.lat, startPoint.lng);
        const end = project(endPoint.lat, endPoint.lng);

        const pathD = buildArcPath(start, end);

        const isActive = route.active === true;
        const strokeOpacity = isActive ? 0.35 : 0.2;
        const dashOpacity = isActive ? 1 : 0.8;
        const strokeWidthBase = isActive ? 3 : 2;
        const dashWidth = isActive ? 4 : 3;

        return (
          <g key={`route-special-${idx}`}>
            {isDark && (
              <>
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.routeStroke}
                  strokeWidth={strokeWidthBase + 4}
                  strokeLinecap="round"
                  opacity={0.1}
                  filter="url(#glow-lg)"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.routeStroke}
                  strokeWidth={strokeWidthBase + 2}
                  strokeLinecap="round"
                  opacity={0.2}
                  filter="url(#glow-md)"
                />
              </>
            )}

            <path
              d={pathD}
              fill="none"
              stroke={colors.routeStroke}
              strokeWidth={strokeWidthBase}
              strokeLinecap="round"
              opacity={strokeOpacity}
            />

            <path
              d={pathD}
              fill="none"
              stroke={colors.routeStroke}
              strokeWidth={dashWidth}
              strokeLinecap="round"
              strokeDasharray="10, 300"
              opacity={dashOpacity}
              filter={isDark ? 'url(#glow)' : ''}
              style={{
                animation: 'dash-flow 3s linear infinite',
                animationPlayState: isDragging ? 'paused' : 'running',
              }}
            />

            {isDark && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#sweep-gradient)"
                strokeWidth={dashWidth}
                strokeLinecap="round"
                strokeDasharray="50, 500"
                opacity={0.6}
                style={{
                  animation: 'dash-flow 4s linear infinite',
                  animationPlayState: isDragging ? 'paused' : 'running',
                }}
              />
            )}

            <g
              style={{
                offsetPath: `path("${pathD}")`,
                animation: 'fly-path 6s ease-in-out infinite',
                animationPlayState: isDragging ? 'paused' : 'running',
                offsetRotate: 'auto',
              }}
            >
              <g transform="translate(-6,-6)">
                <path
                  d="M14 8 L6 2 L7 7 L2 8 L7 9 L6 14 Z"
                  fill={colors.planeFill}
                  opacity={0.95}
                  filter={isDark ? 'url(#glow)' : ''}
                />
              </g>
            </g>

            <path id={`routePath-${idx}`} d={pathD} fill="none" stroke="none" />
          </g>
        );
      })}
    </>
  );
};
