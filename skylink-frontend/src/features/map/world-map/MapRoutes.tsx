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
        const isMain = route.routeLevel === 'MAIN' || !route.routeLevel;
        const isRegional = route.routeLevel === 'REGIONAL';

        const strokeOpacity = isMain ? (isActive ? 0.45 : 0.3) : (isActive ? 0.4 : 0.3);
        const dashOpacity = isMain ? (isActive ? 1 : 0.9) : (isActive ? 0.95 : 0.85);
        const strokeWidthBase = isMain ? (isActive ? 3.5 : 2.5) : (isActive ? 3 : 2.5);
        const dashWidth = isMain ? (isActive ? 4.5 : 3.5) : (isActive ? 4 : 3);

        // 联程航线使用亮橙色，增加对比度
        const routeColor = isRegional ? (isDark ? '#fb923c' : '#f97316') : colors.routeStroke;

        return (
          <g key={`route-special-${idx}`}>
            {isDark && (
              <>
                <path
                  d={pathD}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth={strokeWidthBase + 6}
                  strokeLinecap="round"
                  opacity={isMain ? 0.15 : 0.1}
                  filter="url(#glow-lg)"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth={strokeWidthBase + 3}
                  strokeLinecap="round"
                  opacity={isMain ? 0.25 : 0.15}
                  filter="url(#glow-md)"
                />
              </>
            )}

            <path
              d={pathD}
              fill="none"
              stroke={routeColor}
              strokeWidth={strokeWidthBase}
              strokeLinecap="round"
              opacity={strokeOpacity}
              strokeDasharray={isRegional ? '6,4' : undefined}
              markerEnd={isRegional ? 'url(#arrow-orange)' : undefined}
            />

            <path
              d={pathD}
              fill="none"
              stroke={routeColor}
              strokeWidth={dashWidth}
              strokeLinecap="round"
              strokeDasharray={isMain ? '12, 300' : '8, 200'}
              opacity={dashOpacity}
              filter={isDark ? 'url(#glow)' : ''}
              style={{
                animation: isMain ? 'dash-flow 3s linear infinite' : 'dash-flow 4s linear infinite',
                animationPlayState: isDragging ? 'paused' : 'running',
              }}
            />

            {isDark && isMain && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#sweep-gradient)"
                strokeWidth={dashWidth}
                strokeLinecap="round"
                strokeDasharray="60, 600"
                opacity={0.7}
                style={{
                  animation: 'dash-flow 4s linear infinite',
                  animationPlayState: isDragging ? 'paused' : 'running',
                }}
              />
            )}

            <g
              style={{
                offsetPath: `path("${pathD}")`,
                animation: isMain ? 'fly-path 6s ease-in-out infinite' : 'fly-path 10s ease-in-out infinite',
                animationPlayState: isDragging ? 'paused' : 'running',
                offsetRotate: 'auto',
              }}
            >
              <g transform="translate(-6,-6)">
                <path
                  d="M14 8 L6 2 L7 7 L2 8 L7 9 L6 14 Z"
                  fill={isRegional ? (isDark ? '#fdba74' : '#fb923c') : colors.planeFill}
                  opacity={isMain ? 0.95 : 0.7}
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
