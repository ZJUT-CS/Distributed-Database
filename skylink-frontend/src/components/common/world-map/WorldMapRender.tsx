import React from 'react';
import type { MapPoint } from '@/features/flight';
import WorldMapSvg from '../../../assets/images/Simplified_World_Map.svg?react';
import { MAP_HEIGHT, MAP_WIDTH, VIEWBOX, project } from './geometry';

export type HeatPoint = {
  id: string;
  name?: string;
  lat: number;
  lng: number;
  value: number;
  unit?: string;
};

export type MapRoute = {
  from: string;
  to: string;
  id?: string;
  active?: boolean;
};

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
  onPointMouseEnter: (point: MapPoint, rect: DOMRect) => void;
  onPointMouseLeave: () => void;
}

// 投影算法：来自 ./geometry，与自动聚焦计算保持一致

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '').trim();
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const to2 = (x: number) => Math.round(x).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
};

const lerpColor = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(lerp(ca.r, cb.r, t), lerp(ca.g, cb.g, t), lerp(ca.b, cb.b, t));
};

const getHeatColor = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { fill: '#10b981', opacity: 0.65 };
  }

  // 低价更绿，高价更红
  const t = clamp01((value - min) / (max - min));
  const green = '#10b981';
  const yellow = '#eab308';
  const red = '#ef4444';
  const fill = t < 0.55 ? lerpColor(green, yellow, t / 0.55) : lerpColor(yellow, red, (t - 0.55) / 0.45);
  const opacity = 0.25 + 0.55 * (1 - Math.abs(t - 0.5) * 2);
  return { fill, opacity };
};

const buildArcPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // 曲率随距离变化：长航线弧更高
  const lift = Math.min(220, Math.max(70, dist * 0.35));
  // 垂直法向
  const nx = dist === 0 ? 0 : -dy / dist;
  const ny = dist === 0 ? -1 : dx / dist;
  const cx = midX + nx * lift;
  const cy = midY + ny * lift;
  return `M${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
};

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
  onPointMouseEnter,
  onPointMouseLeave,
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

    // Mirror the old CSS transform: px' = px * scale + offset.
    // Base mapping: px = user * s + t.
    // Solve user' = user * scale + b  such that (user' * s + t) == (user * s + t) * scale + offset.
    const bx = ((scale - 1) * tx + offset.x) / sx;
    const by = ((scale - 1) * ty + offset.y) / sy;

    return `matrix(${scale} 0 0 ${scale} ${bx} ${by})`;
  }, [baseMapping, offset.x, offset.y, scale]);

  // Colors based on theme
  const colors = {
    grid: isDark ? '#334155' : '#f1f5f9',
    hub: '#ef4444',
    origin: '#3b82f6',
    destination: '#10b981',
    routeStroke: isDark ? 'url(#routeGradientDark)' : '#3b82f6',
    planeFill: isDark ? '#60a5fa' : '#2563eb',
    mapOpacity: isDark ? 0.4 : 0.3,
  };

  const landmassStyle = React.useMemo(() => {
    // Avoid CSS filter to prevent browser rasterizing the map layer.
    // In dark mode, recolor the SVG paths via CSS variables.
    return {
      '--wm-land-fill': isDark ? '#94a3b8' : '#64748b',
    } as React.CSSProperties;
  }, [isDark]);

  const getPointColor = (type: string) => {
    if (type === 'hub') return colors.hub;
    if (type === 'origin') return colors.origin;
    if (type === 'destination') return colors.destination;
    return '#eab308';
  };

  return (
    <svg
      viewBox="-150 -20 1250 800"
      className="w-full h-full block"
      preserveAspectRatio={preserveAspectRatio}
      ref={svgRef}
    >
      <defs>
        <linearGradient id="routeGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Grid Pattern for better performance */}
        <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke={colors.grid}
            strokeWidth="1"
            opacity={isDark ? 0.1 : 1}
          />
        </pattern>
      </defs>

      {/* Global Styles for Animations */}
      <style>
        {`
          @keyframes pulse-radius {
            0%, 100% { r: 5px; }
            50% { r: 8px; }
          }
          @keyframes pulse-radius-large {
            0%, 100% { r: 10px; }
            50% { r: 18px; }
          }
          @keyframes pulse-opacity {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
          @keyframes fly-path {
            0% { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
          @keyframes dash-flow {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
          }

          /* Recolor the imported world SVG without expensive CSS filters. */
          .world-map-landmass svg :is(path, polygon, rect, circle, ellipse) {
            fill: var(--wm-land-fill) !important;
          }
        `}
      </style>

      <g transform={cameraTransform || undefined}>
        {/* Background Grid */}
        {showGrid && <rect x="-500" y="-300" width="2100" height="1500" fill="url(#grid-pattern)" />}

        {/* World Map (Vector SVG for crisp rendering at any zoom) */}
        <g className="world-map-landmass pointer-events-none" opacity={colors.mapOpacity} style={landmassStyle}>
          <WorldMapSvg width={MAP_WIDTH} height={MAP_HEIGHT} />
        </g>

        {/* Heat Points (Price Heatmap) */}
        {heatPoints && heatPoints.length > 0 && (() => {
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
                    <circle cx={x} cy={y} r={12} fill={fill} opacity={opacity * 0.65} filter={isDark ? 'url(#glow)' : ''} />
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Routes Rendering */}
        {routes &&
          routes.map((route, idx) => {
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
                      d="M2 8 L10 2 L9 7 L14 8 L9 9 L10 14 Z"
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

      {/* Normal Mode Radiation Lines */}
      {!routes &&
        points
          .filter((p) => p.type === 'normal')
          .map((target, idx) => {
            const hub = points.find((p) => p.type === 'hub') || points[0];
            const start = project(hub.lat, hub.lng);
            const end = project(target.lat, target.lng);
            const pathD = buildArcPath(start, end);
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
          })}

      {/* Points */}
      {points.map((point) => {
        const { x, y } = project(point.lat, point.lng);
        const isLarge = point.type === 'hub' || point.type === 'origin' || point.type === 'destination';
        const pointColor = getPointColor(point.type);
        const delay = -1 * ((Math.abs(point.lat + point.lng) * 100) % 5) + 's';

        return (
          <g
            key={point.id}
            onMouseEnter={(e) => onPointMouseEnter(point, e.currentTarget.getBoundingClientRect())}
            onMouseLeave={onPointMouseLeave}
            style={{ cursor: 'pointer' }}
          >
            {/* Pulsing Background Circle */}
            <circle
              cx={x}
              cy={y}
              fill={pointColor}
              opacity={isDark ? 0.6 : 0.3}
              style={{
                animation: `${isLarge ? 'pulse-radius-large' : 'pulse-radius'} 4s ease-in-out infinite, pulse-opacity 4s ease-in-out infinite`,
                animationDelay: delay,
                animationPlayState: isDragging ? 'paused' : 'running',
              }}
              r={isLarge ? 10 : 5}
            />

            {/* Static Center Core */}
            <circle
              cx={x}
              cy={y}
              r={isLarge ? 5 : 3}
              fill={pointColor}
              stroke={isDark ? '#fff' : '#fff'}
              strokeWidth="1.5"
              filter={isDark ? 'url(#glow)' : ''}
            />

            {(point.type === 'origin' || point.type === 'destination') && (
              <text
                x={x}
                y={y + 25}
                textAnchor="middle"
                fill={isDark ? '#e2e8f0' : '#334155'}
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: isDark ? '0 2px 4px #000' : '0 1px 2px rgba(255,255,255,0.8)' }}
              >
                {point.id}
              </text>
            )}
          </g>
        );
      })}

      </g>
    </svg>
  );
};
