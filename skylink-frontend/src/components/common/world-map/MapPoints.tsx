import React from 'react';
import type { MapPoint } from '@/features/flight';
import { project } from './geometry';

interface MapPointsProps {
  points: MapPoint[];
  hoveredPoint?: MapPoint | null;
  colors: {
    hub: string;
    origin: string;
    destination: string;
  };
  isDark: boolean;
  onPointMouseEnter: (point: MapPoint, rect: DOMRect) => void;
  onPointMouseLeave: () => void;
  onPointDoubleClick?: (point: MapPoint, projected: { x: number; y: number }) => void;
}

export const MapPoints: React.FC<MapPointsProps> = ({
  points,
  hoveredPoint,
  colors,
  isDark,
  onPointMouseEnter,
  onPointMouseLeave,
  onPointDoubleClick,
}) => {
  const getPointColor = (type: string) => {
    if (type === 'hub') return colors.hub;
    if (type === 'origin') return colors.origin;
    if (type === 'destination') return colors.destination;
    return '#eab308';
  };

  return (
    <>
      {points.map((point) => {
        const { x, y } = project(point.lat, point.lng);
        const isLarge = point.type === 'hub' || point.type === 'origin' || point.type === 'destination';
        const isHovered = hoveredPoint?.id === point.id;
        const color = getPointColor(point.type);

        return (
          <g
            key={`point-${point.id}`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onPointMouseEnter(point, rect);
            }}
            onMouseLeave={onPointMouseLeave}
            onDoubleClick={onPointDoubleClick ? () => onPointDoubleClick(point, { x, y }) : undefined}
            className="cursor-pointer"
          >
            {isDark && (
              <>
                <circle cx={x} cy={y} r={isLarge ? 28 : 22} fill={color} opacity={0.15} />
                <circle cx={x} cy={y} r={isLarge ? 22 : 16} fill={color} opacity={0.3} />
              </>
            )}

            {isLarge ? (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={isLarge ? 18 : 12}
                  fill={color}
                  opacity={isDark ? 0.8 : 0.7}
                  filter={isDark ? 'url(#glow-lg)' : ''}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isLarge ? 10 : 6}
                  fill={isDark ? '#1e293b' : '#fff'}
                  opacity={isHovered ? 0.9 : 0.7}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isLarge ? 5 : 3}
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                />
              </>
            ) : (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 10 : 6}
                  fill={color}
                  opacity={isDark ? 0.75 : 0.65}
                  filter={isDark ? 'url(#glow-md)' : ''}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 4 : 2.5}
                  fill={isDark ? '#1e293b' : '#fff'}
                  opacity={isHovered ? 0.9 : 0.6}
                />
              </>
            )}

            {isHovered && (
              <>
                <circle cx={x} cy={y} r={isLarge ? 22 : 14} fill="none" stroke={color} strokeWidth="2" opacity={0.5} />
                <circle cx={x} cy={y} r={isLarge ? 26 : 18} fill="none" stroke={color} strokeWidth="1.5" opacity={0.3} />
              </>
            )}
          </g>
        );
      })}
    </>
  );
};
