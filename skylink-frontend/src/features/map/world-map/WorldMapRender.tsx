import React from 'react';
import type { MapPoint } from '@/features/flight';
import type { HeatPoint, MapRoute } from '../WorldMap';
import WorldMapSvg from '../../../assets/images/Simplified_World_Map.svg?react';
import { MAP_HEIGHT, MAP_WIDTH, VIEWBOX, project } from './geometry';
import { useMemo, useCallback } from 'react';
import { MapDefs } from './MapDefs';
import { MapStyles } from './MapStyles';
import { MapGrid } from './MapGrid';
import { MapHeatPoints } from './MapHeatPoints';
import { MapRoutes } from './MapRoutes';
import { MapPoints } from './MapPoints';

export interface WorldMapRenderProps {
  points: MapPoint[];
  routes?: MapRoute[];
  heatPoints?: HeatPoint[];
  showGrid: boolean;
  theme: 'light' | 'dark';
  preserveAspectRatio: string;
  offset: { x: number; y: number };
  scale: number;
  isDragging: boolean;
  hoveredPoint?: MapPoint | null;
  elastic?: { deformationX: number; deformationY: number; hoverScale: number };
  onPointMouseEnter: (point: MapPoint, rect: DOMRect) => void;
  onPointMouseLeave: () => void;
  onPointDoubleClick?: (point: MapPoint, projected: { x: number; y: number }) => void;
}

export const WorldMapRender: React.FC<WorldMapRenderProps> = ({
  points,
  routes,
  heatPoints,
  showGrid,
  theme,
  preserveAspectRatio,
  offset,
  scale,
  isDragging,
  hoveredPoint = null,
  elastic = { deformationX: 0, deformationY: 0, hoverScale: 1 },
  onPointMouseEnter,
  onPointMouseLeave,
  onPointDoubleClick,
}) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setViewport({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isDark = theme === 'dark';

  const getPreserveMode = (v: string): 'meet' | 'slice' | 'none' => {
    const s = v.toLowerCase();
    if (s.includes('none')) return 'none';
    if (s.includes('slice')) return 'slice';
    return 'meet';
  };

  const baseMapping = React.useMemo(() => {
    const w = viewport.width;
    const h = viewport.height;
    if (!w || !h) return { sx: 0, sy: 0, tx: 0, ty: 0 };

    const mode = getPreserveMode(preserveAspectRatio);

    if (mode === 'none') {
      const sx = w / VIEWBOX.width;
      const sy = h / VIEWBOX.height;
      return {
        sx,
        sy,
        tx: -VIEWBOX.minX * sx,
        ty: -VIEWBOX.minY * sy,
      };
    }

    const s0 =
      mode === 'slice'
        ? Math.max(w / VIEWBOX.width, h / VIEWBOX.height)
        : Math.min(w / VIEWBOX.width, h / VIEWBOX.height);

    return {
      sx: s0,
      sy: s0,
      tx: (w - VIEWBOX.width * s0) / 2 - VIEWBOX.minX * s0,
      ty: (h - VIEWBOX.height * s0) / 2 - VIEWBOX.minY * s0,
    };
  }, [viewport.width, viewport.height, preserveAspectRatio]);

  const cameraTransform = React.useMemo(() => {
    const { sx, sy, tx, ty } = baseMapping;
    if (!sx || !sy || !Number.isFinite(scale)) return '';

    const elasticOffsetX = elastic.deformationX;
    const elasticOffsetY = elastic.deformationY;

    const bx = ((scale - 1) * tx + offset.x + elasticOffsetX) / sx;
    const by = ((scale - 1) * ty + offset.y + elasticOffsetY) / sy;

    return `matrix(${scale} 0 0 ${scale} ${bx} ${by})`;
  }, [baseMapping, offset.x, offset.y, scale, elastic.deformationX, elastic.deformationY]);

  const colors = {
    grid: isDark ? '#334155' : '#bfdbfe', // 浅色模式下用 blue-200 网格
    hub: '#ef4444',
    origin: '#3b82f6',
    destination: '#10b981',
    routeStroke: isDark ? 'url(#routeGradientDark)' : '#2563eb', // 更加鲜艳的蓝色线条
    planeFill: isDark ? '#60a5fa' : '#1d4ed8',
    mapOpacity: isDark ? 0.4 : 0.85, // 提高陆地不透明度
  };

  const landmassStyle = React.useMemo(() => {
    return {
      '--wm-land-fill': isDark ? '#94a3b8' : '#596c8e', // 使用钢蓝色作为陆地填充
      '--wm-land-stroke': isDark ? '#334155' : '#ffffff', // 浅色模式下白色描边增强轮廓
    } as React.CSSProperties;
  }, [isDark]);

  const visibleBounds = React.useMemo(() => {
    if (!viewport.width || !viewport.height) return null;
    const { sx, sy, tx, ty } = baseMapping;
    if (!sx || !sy || !Number.isFinite(scale)) return null;

    const elasticOffsetX = elastic.deformationX;
    const elasticOffsetY = elastic.deformationY;

    const bx = ((scale - 1) * tx + offset.x + elasticOffsetX) / sx;
    const by = ((scale - 1) * ty + offset.y + elasticOffsetY) / sy;

    const viewBoxMinX = -VIEWBOX.minX;
    const viewBoxMinY = -VIEWBOX.minY;

    const visibleMinX = (-bx) / scale - viewBoxMinX;
    const visibleMinY = (-by) / scale - viewBoxMinY;
    const visibleMaxX = (viewport.width - bx) / scale - viewBoxMinX;
    const visibleMaxY = (viewport.height - by) / scale - viewBoxMinY;

    const padding = 100;

    return {
      minX: visibleMinX - padding,
      minY: visibleMinY - padding,
      maxX: visibleMaxX + padding,
      maxY: visibleMaxY + padding,
    };
  }, [viewport.width, viewport.height, baseMapping, offset.x, offset.y, scale, elastic.deformationX, elastic.deformationY]);

  const isPointVisible = useCallback(
    (x: number, y: number) => {
      if (!visibleBounds) return true;
      return x >= visibleBounds.minX && x <= visibleBounds.maxX && y >= visibleBounds.minY && y <= visibleBounds.maxY;
    },
    [visibleBounds],
  );

  const isRouteVisible = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!visibleBounds) return true;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      return !(maxX < visibleBounds.minX || minX > visibleBounds.maxX || maxY < visibleBounds.minY || minY > visibleBounds.maxY);
    },
    [visibleBounds],
  );

  const visiblePoints = useMemo(() => {
    return points.filter((p) => {
      const { x, y } = project(p.lat, p.lng);
      return isPointVisible(x, y);
    });
  }, [points, isPointVisible]);

  const visibleRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((route) => {
      const startPoint = points.find((p) => p.id === route.from);
      const endPoint = points.find((p) => p.id === route.to);
      if (!startPoint || !endPoint) return false;
      const start = project(startPoint.lat, startPoint.lng);
      const end = project(endPoint.lat, endPoint.lng);
      return isRouteVisible(start.x, start.y, end.x, end.y);
    });
  }, [routes, points, isRouteVisible]);

  const normalModeRoutes = useMemo(() => {
    if (routes) return null;
    const hub = visiblePoints.find((p) => p.type === 'hub') || visiblePoints[0];
    return visiblePoints
      .filter((p) => p.type === 'normal')
      .map((target, idx) => {
        const start = project(hub.lat, hub.lng);
        const end = project(target.lat, target.lng);
        const pathD = `M${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${(start.y + end.y) / 2 - Math.min(220, Math.max(70, Math.hypot(end.x - start.x, end.y - start.y) * 0.35))} ${end.x} ${end.y}`;
        return (
          <path
            key={`line-${idx}`}
            d={pathD}
            fill="none"
            stroke={target.type === 'hub' ? '#ef4444' : '#3b82f6'}
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="5, 100"
            style={{
              animation: 'dash-flow 4s linear infinite',
              animationPlayState: isDragging ? 'paused' : 'running',
            }}
          />
        );
      });
  }, [routes, visiblePoints, isDragging]);

  return (
    <svg
      viewBox="-150 -20 1250 800"
      className="w-full h-full block"
      preserveAspectRatio={preserveAspectRatio}
      ref={svgRef}
    >
      <MapDefs isDark={isDark} gridColor={colors.grid} />
      <MapStyles />

      <g transform={cameraTransform || undefined}>
        {showGrid && <MapGrid />}

        <g className="world-map-landmass pointer-events-none" opacity={colors.mapOpacity} style={landmassStyle}>
          <WorldMapSvg width={MAP_WIDTH} height={MAP_HEIGHT} />
        </g>

        {heatPoints && heatPoints.length > 0 && <MapHeatPoints heatPoints={heatPoints} isDragging={isDragging} />}

        {visibleRoutes && visibleRoutes.length > 0 && (
          <MapRoutes routes={visibleRoutes} points={points} isDragging={isDragging} isDark={isDark} colors={colors} />
        )}

        {normalModeRoutes}

        <MapPoints
          points={visiblePoints}
          hoveredPoint={hoveredPoint}
          colors={{ hub: colors.hub, origin: colors.origin, destination: colors.destination }}
          isDark={isDark}
          onPointMouseEnter={onPointMouseEnter}
          onPointMouseLeave={onPointMouseLeave}
          onPointDoubleClick={onPointDoubleClick}
        />
      </g>
    </svg>
  );
};
