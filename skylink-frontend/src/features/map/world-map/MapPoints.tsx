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
    // normal / other points
    return colors.origin;
  };

  return (
    <>
      {points.map((point) => {
        const { x, y } = project(point.lat, point.lng);
        const isLarge = point.type === 'hub' || point.type === 'origin' || point.type === 'destination';
        const isHovered = hoveredPoint?.id === point.id;
        const color = getPointColor(point.type);

        // Visual sizes (intentionally small; map is dense).
        const haloOuterR = isLarge ? 10 : 7;
        const haloInnerR = isLarge ? 8 : 5;

        const coreOuterR = isLarge ? 4 : (isHovered ? 3 : 2);
        const coreInnerBgR = isLarge ? 2.2 : (isHovered ? 1.4 : 1.0);
        const coreDotR = isLarge ? 1.3 : (isHovered ? 0.9 : 0.7);

        const hoverRing1R = isLarge ? 6 : 4;
        const hoverRing2R = isLarge ? 8 : 5.5;

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
                <circle cx={x} cy={y} r={haloOuterR} fill={color} opacity={0.15} />
                <circle cx={x} cy={y} r={haloInnerR} fill={color} opacity={0.3} />
              </>
            )}

            {isLarge ? (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={coreOuterR}
                  fill={color}
                  opacity={isDark ? 0.8 : 0.7}
                  filter={isDark ? 'url(#glow-lg)' : ''}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={coreInnerBgR}
                  fill={isDark ? '#1e293b' : '#fff'}
                  opacity={isHovered ? 0.9 : 0.7}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={coreDotR}
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                />
              </>
            ) : (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={coreOuterR}
                  fill={color}
                  opacity={isDark ? 0.75 : 0.65}
                  filter={isDark ? 'url(#glow-md)' : ''}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={coreInnerBgR}
                  fill={isDark ? '#1e293b' : '#fff'}
                  opacity={isHovered ? 0.9 : 0.6}
                />
              </>
            )}

            {isHovered && (
              <>
                <circle cx={x} cy={y} r={hoverRing1R} fill="none" stroke={color} strokeWidth="1.5" opacity={0.5} />
                <circle cx={x} cy={y} r={hoverRing2R} fill="none" stroke={color} strokeWidth="1" opacity={0.3} />
              </>
            )}
          </g>
        );
      })}
    </>
  );
};
