import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Minus, Plus, RotateCcw } from 'lucide-react';
import type { MapPoint } from '@/features/flight';
import { WorldMapRender } from './world-map/WorldMapRender';
import { useWorldMapControls } from './world-map/useWorldMapControls';
import type { WorldMapView } from './world-map/geometry';
import { computeAutoFitView } from './world-map/geometry';
import { useMapDataIncremental } from '@/hooks/useMapDataIncremental';
import type { RouteDictItem, CityDictItem } from '@/features/admin/dashboard/map';

export interface HeatPoint {
  id: string;
  name?: string;
  lat: number;
  lng: number;
  /** 数值越低越“冷”（更便宜），越高越“热”（更贵） */
  value: number;
  unit?: string;
}

export interface MapRoute {
  from: string;
  to: string;
  /** 可选：用于高亮/识别 */
  id?: string;
  /** 可选：用于强调某条路线 */
  active?: boolean;
  orderCount?: number;
  gmv?: number;
  avgPrice?: number;
  activeFlights?: number;
  routeLevel?: 'MAIN' | 'REGIONAL' | 'LOCAL';
}

interface WorldMapProps {
  points: MapPoint[];
  routes?: MapRoute[];
  heatPoints?: HeatPoint[];
  showHeatLegend?: boolean;
  className?: string;
  showGrid?: boolean;
  theme?: 'light' | 'dark';
  preserveAspectRatio?: string;
  enableControls?: boolean;
  autoFit?: boolean;
  autoFitPaddingPx?: number;
  onReset?: () => void;
  onViewChange?: (view: { scale: number; offset: { x: number; y: number } }) => void;
  minScale?: number;
  maxScale?: number;
  defaultScale?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  defaultZoomLevel?: number;
  routeDict?: RouteDictItem[];
  cityDict?: CityDictItem[];
  onDataChange?: (diff: { routes: RouteDictItem[]; cities: CityDictItem[] }) => void;
  enableIncrementalUpdates?: boolean;
  refreshInterval?: number;
}

const WorldMap: React.FC<WorldMapProps> = ({
  points,
  routes,
  heatPoints,
  showHeatLegend = false,
  className = '',
  showGrid = true,
  theme = 'light',
  preserveAspectRatio,
  enableControls = false,
  autoFit = false,
  autoFitPaddingPx,
  onReset,
  onViewChange,
  minScale,
  maxScale,
  defaultScale,
  routeDict,
  cityDict,
  onDataChange,
  enableIncrementalUpdates = false,
  refreshInterval = 30000,
}) => {
  const incrementalData = useMapDataIncremental(enableIncrementalUpdates ? refreshInterval : 0);

  React.useEffect(() => {
    if (!enableIncrementalUpdates || !incrementalData.diff) return;
    onDataChange?.({
      routes: incrementalData.routes,
      cities: incrementalData.cities,
    });
  }, [incrementalData.diff, enableIncrementalUpdates, onDataChange, incrementalData.routes, incrementalData.cities]);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [defaultView, setDefaultView] = useState<WorldMapView | undefined>(undefined);
  const appliedKeyRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const isDark = theme === 'dark';
  const effectivePreserveAspectRatio = preserveAspectRatio ?? (enableControls ? 'xMidYMid meet' : 'xMidYMid slice');

  const autoFitKey = useMemo(() => {
    if (!autoFit) return '';
    const ids = points.map((p) => p.id).slice().sort();
    const routeCount = routes?.length ?? 0;
    return `${effectivePreserveAspectRatio}|${ids.join('|')}|routes:${routeCount}`;
  }, [autoFit, points, routes, effectivePreserveAspectRatio]);

  const {
    containerRef,
    offset,
    scale,
    isDragging,
    dragIndicator,
    elastic,
    effectiveMinScale,
    effectiveMaxScale,
    resetView,
    zoomIn,
    zoomOut,
    triggerHoverScale,
    focusOnPoint,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
  } = useWorldMapControls({
    enableControls,
    minScale,
    maxScale,
    defaultScale,
    defaultView,
    onReset: () => {
      setHoveredPoint(null);
      setTooltipPos({ x: 0, y: 0 });
      onReset?.();
    },
    onViewChange,
  });

  useEffect(() => {
    if (!autoFit) return;
    if (!autoFitKey) return;
    if (appliedKeyRef.current === autoFitKey) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    setCanvasSize({ width: rect.width, height: rect.height });

    const next = computeAutoFitView({
      points,
      viewport: { width: rect.width, height: rect.height },
      preserveAspectRatio: effectivePreserveAspectRatio,
      paddingPx: autoFitPaddingPx,
    });

    setDefaultView(next);
    appliedKeyRef.current = autoFitKey;
  }, [autoFit, autoFitKey, points, effectivePreserveAspectRatio, autoFitPaddingPx, containerRef]);

  const getPointColor = (type: string) => {
    if (type === 'hub') return '#ef4444';
    if (type === 'origin') return '#3b82f6';
    if (type === 'destination') return '#10b981';
    return '#eab308';
  };

  const hasHeat = Array.isArray(heatPoints) && heatPoints.length > 0;
  const heatDomain = (() => {
    if (!hasHeat) return { min: 0, max: 0 };
    const vals = heatPoints!.map((p) => Number(p.value)).filter((x) => Number.isFinite(x));
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  })();

  return (
    <div
      ref={containerRef}
      tabIndex={enableControls ? 0 : undefined}
      aria-label={enableControls ? '地图（可缩放）' : undefined}
      className={`relative w-full h-full rounded-xl overflow-hidden ${className} ${!className.includes('bg-') ? (isDark ? 'bg-transparent' : 'bg-slate-50') : ''} ${enableControls ? `outline-none ${dragIndicator.active ? 'cursor-grabbing' : 'cursor-grab'}` : ''}`}
      style={enableControls ? ({ touchAction: 'none' } as any) : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      <WorldMapRender
        points={points}
        routes={routes}
        heatPoints={heatPoints}
        showGrid={showGrid}
        theme={theme}
        preserveAspectRatio={effectivePreserveAspectRatio}
        offset={offset}
        scale={scale}
        isDragging={isDragging}
        hoveredPoint={hoveredPoint}
        elastic={elastic}
        onPointMouseEnter={(point, rect) => {
          setTooltipPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 10 });
          setHoveredPoint(point);
          triggerHoverScale(1.5);
        }}
        onPointMouseLeave={() => {
          setHoveredPoint(null);
          triggerHoverScale(1);
        }}
        onPointDoubleClick={(point, projected) => {
          focusOnPoint(projected.x, projected.y, 2);
        }}
        canvasRef={canvasRef}
      />

      {routes && routes.length > 0 && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
        />
      )}

      {enableControls && dragIndicator.active && dragIndicator.strength > 0.01 && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div
            className={`${isDark ? 'text-slate-200' : 'text-slate-700'}`}
            style={{
              transform: `rotate(${dragIndicator.angle}deg)`,
              opacity: 0.25 + 0.55 * dragIndicator.strength,
            }}
          >
            <ArrowUp className="w-7 h-7" />
          </div>
        </div>
      )}

      {enableControls && (
        <div
          role="group"
          aria-label="地图缩放控制"
          data-worldmap-controls
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          className={`absolute bottom-4 right-4 z-20 flex flex-col gap-2 ${isDark ? '' : ''}`}
        >
          <div className="flex justify-end">
            <div className={`px-2.5 py-1 rounded-xl border shadow-lg backdrop-blur-md text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white/70 border-gray-200 text-gray-700'}`}>
              {Math.round(scale * 100)}%
            </div>
          </div>
          <div className={`overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/70 border-gray-200'}`}>
            <button
              type="button"
              aria-label="放大"
              disabled={scale >= effectiveMaxScale}
              onClick={zoomIn}
              className={`w-11 h-11 flex items-center justify-center transition-all select-none ${isDark ? 'text-slate-100 hover:bg-white/10 active:bg-white/15' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset`}
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className={`${isDark ? 'border-t border-slate-800' : 'border-t border-gray-200'}`} />
            <button
              type="button"
              aria-label="缩小"
              disabled={scale <= effectiveMinScale}
              onClick={zoomOut}
              className={`w-11 h-11 flex items-center justify-center transition-all select-none ${isDark ? 'text-slate-100 hover:bg-white/10 active:bg-white/15' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset`}
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="复位"
            onClick={resetView}
            className={`w-11 h-11 rounded-2xl border shadow-xl backdrop-blur-md flex items-center justify-center transition-all select-none focus:outline-none focus:ring-2 focus:ring-sky-400 ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-100 hover:bg-white/10 active:bg-white/15' : 'bg-white/70 border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {hasHeat && showHeatLegend && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <div
            className={`rounded-2xl border shadow-xl backdrop-blur-md px-4 py-3 ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-100' : 'bg-white/70 border-gray-200 text-gray-700'}`}
          >
            <div className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>价格热力</div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-2.5 w-28 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(16,185,129,0.9) 0%, rgba(234,179,8,0.9) 55%, rgba(239,68,68,0.9) 100%)',
                }}
              />
              <div className={`text-[10px] font-mono ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {Math.round(heatDomain.min)} - {Math.round(heatDomain.max)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 bg-slate-900/90 text-white text-xs rounded-lg py-2 px-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 border border-slate-700 backdrop-blur-sm"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-slate-200">{hoveredPoint.name}</div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getPointColor(hoveredPoint.type) }}></span>
            <span className="text-slate-300">{hoveredPoint.info || hoveredPoint.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMap;