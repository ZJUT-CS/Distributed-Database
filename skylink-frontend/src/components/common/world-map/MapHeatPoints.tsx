import React from 'react';
import type { HeatPoint } from './WorldMapRender';
import { getHeatColor } from './utils/colorUtils';
import { project } from './geometry';

interface MapHeatPointsProps {
  heatPoints: HeatPoint[];
  isDragging: boolean;
}

export const MapHeatPoints: React.FC<MapHeatPointsProps> = ({ heatPoints, isDragging }) => {
  const vals = heatPoints.map((p) => Number(p.value)).filter((x) => Number.isFinite(x));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 0;

  return (
    <g aria-label="价格热力" opacity={isDragging ? 0.5 : 1}>
      {heatPoints.map((p) => {
        const { x, y } = project(p.lat, p.lng);
        const { fill, opacity } = getHeatColor(p.value, min, max);
        return (
          <g key={`heat-${p.id}`}>
            <circle cx={x} cy={y} r={22} fill={fill} opacity={opacity * 0.35} />
            <circle cx={x} cy={y} r={12} fill={fill} opacity={opacity * 0.65} />
          </g>
        );
      })}
    </g>
  );
};
