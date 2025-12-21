import React, { useState } from 'react';
import { ArrowUp, Minus, Plus, RotateCcw } from 'lucide-react';
import type { MapPoint } from '@/features/flight';
import { WorldMapRender } from './world-map/WorldMapRender';
import { useWorldMapControls } from './world-map/useWorldMapControls';

interface WorldMapProps {
  points: MapPoint[];
  routes?: { from: string; to: string }[];
  className?: string;
  showGrid?: boolean;
  theme?: 'light' | 'dark';
  preserveAspectRatio?: string;
  enableControls?: boolean;
  onReset?: () => void;
  onViewChange?: (view: { scale: number; offset: { x: number; y: number } }) => void;
  minScale?: number;
  maxScale?: number;
  defaultScale?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  defaultZoomLevel?: number;
}

const WorldMap: React.FC<WorldMapProps> = ({
  points,
  routes,
  className = '',
  showGrid = true,
  theme = 'light',
  preserveAspectRatio,
  enableControls = false,
  onReset,
  onViewChange,
  minScale,
  maxScale,
  defaultScale,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const isDark = theme === 'dark';
  const effectivePreserveAspectRatio = preserveAspectRatio ?? (enableControls ? 'xMidYMid meet' : 'xMidYMid slice');
  const {
    containerRef,
    offset,
    scale,
    isDragging,
    dragIndicator,
    effectiveMinScale,
    effectiveMaxScale,
    resetView,
    zoomIn,
    zoomOut,
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
    onReset: () => {
      setHoveredPoint(null);
      setTooltipPos({ x: 0, y: 0 });
      onReset?.();
    },
    onViewChange,
  });

  const getPointColor = (type: string) => {
    if (type === 'hub') return '#ef4444';
    if (type === 'origin') return '#3b82f6';
    if (type === 'destination') return '#10b981';
    return '#eab308';
  };

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
        showGrid={showGrid}
        theme={theme}
        preserveAspectRatio={effectivePreserveAspectRatio}
        offset={offset}
        scale={scale}
        isDragging={isDragging}
        onPointMouseEnter={(point, rect) => {
          setTooltipPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 10 });
          setHoveredPoint(point);
        }}
        onPointMouseLeave={() => setHoveredPoint(null)}
      />

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