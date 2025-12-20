import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Minus, Plus, RotateCcw } from 'lucide-react';
import { MapPoint } from '../../types';
import worldMapSvg from '../../assets/images/Simplified_World_Map.svg';

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === 'dark';
  const effectivePreserveAspectRatio = preserveAspectRatio ?? (enableControls ? 'xMidYMid meet' : 'xMidYMid slice');
  const effectiveMinScale = minScale ?? 0.5;
  const effectiveMaxScale = maxScale ?? 3;
  const effectiveDefaultScale = defaultScale ?? 1;

  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(() =>
    Math.min(effectiveMaxScale, Math.max(effectiveMinScale, effectiveDefaultScale)),
  );
  const scaleRef = useRef<number>(Math.min(effectiveMaxScale, Math.max(effectiveMinScale, effectiveDefaultScale)));

  const clampScale = (s: number) => Math.min(effectiveMaxScale, Math.max(effectiveMinScale, s));
  const BUTTON_ZOOM_FACTOR = 1.1;
  const DRAG_DECAY = 0.95;

  const clampOffset = (candidate: { x: number; y: number }, nextScale: number) => {
    const el = containerRef.current;
    if (!el) return candidate;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return candidate;

    const scaledW = w * nextScale;
    const scaledH = h * nextScale;

    let minX = 0;
    let maxX = 0;
    if (scaledW <= w) {
      minX = maxX = (w - scaledW) / 2;
    } else {
      minX = w - scaledW;
      maxX = 0;
    }

    let minY = 0;
    let maxY = 0;
    if (scaledH <= h) {
      minY = maxY = (h - scaledH) / 2;
    } else {
      minY = h - scaledH;
      maxY = 0;
    }

    const x = Math.min(maxX, Math.max(minX, candidate.x));
    const y = Math.min(maxY, Math.max(minY, candidate.y));
    return { x, y };
  };

  const getCenteredOffset = (nextScale: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return { x: 0, y: 0 };
    return {
      x: (w - w * nextScale) / 2,
      y: (h - h * nextScale) / 2,
    };
  };

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setOffset((prev) => clampOffset(prev, scaleRef.current));
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [enableControls]);

  useEffect(() => {
    const next = clampScale(effectiveDefaultScale);
    scaleRef.current = next;
    setScale(next);
    setOffset((prev) => clampOffset(prev, next));
  }, [effectiveDefaultScale, effectiveMinScale, effectiveMaxScale]);

  const applyView = (nextScale: number, nextOffset: { x: number; y: number }) => {
    scaleRef.current = nextScale;
    offsetRef.current = nextOffset;
    setScale(nextScale);
    setOffset(nextOffset);
  };

  const inertiaRafRef = useRef<number | null>(null);
  const inertiaVelRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const stopInertia = () => {
    if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current);
    inertiaRafRef.current = null;
    inertiaVelRef.current = { vx: 0, vy: 0 };
  };

  const startInertia = (vx: number, vy: number) => {
    stopInertia();
    inertiaVelRef.current = { vx, vy };

    const step = () => {
      const v = inertiaVelRef.current;
      v.vx *= DRAG_DECAY;
      v.vy *= DRAG_DECAY;

      const prev = offsetRef.current;
      const candidate = { x: prev.x + v.vx, y: prev.y + v.vy };
      const clamped = clampOffset(candidate, scaleRef.current);
      const movedX = clamped.x - prev.x;
      const movedY = clamped.y - prev.y;

      if (Math.abs(movedX - v.vx) > 0.01) v.vx = 0;
      if (Math.abs(movedY - v.vy) > 0.01) v.vy = 0;

      applyView(scaleRef.current, clamped);

      if (Math.abs(v.vx) + Math.abs(v.vy) < 0.2) {
        stopInertia();
        onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
        return;
      }
      inertiaRafRef.current = requestAnimationFrame(step);
    };

    inertiaRafRef.current = requestAnimationFrame(step);
  };

  const zoomByFactor = (factor: number) => {
    if (!enableControls) return;
    stopInertia();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = rect.width / 2;
    const py = rect.height / 2;

    const prevScale = scaleRef.current;
    const nextScale = clampScale(prevScale * factor);
    const prevOffset = offsetRef.current;
    const k = prevScale > 0 ? nextScale / prevScale : 1;
    const nextOffset = {
      x: px - (px - prevOffset.x) * k,
      y: py - (py - prevOffset.y) * k,
    };
    const clamped = clampOffset(nextOffset, nextScale);
    applyView(nextScale, clamped);
    onViewChange?.({ scale: nextScale, offset: clamped });
  };

  const resetView = () => {
    const el = containerRef.current;
    if (!el) return;
    stopInertia();
    const nextScale = clampScale(1);
    const centered = clampOffset(getCenteredOffset(nextScale), nextScale);
    setHoveredPoint(null);
    setTooltipPos({ x: 0, y: 0 });
    pointersRef.current.clear();
    pinchBaseRef.current = null;
    onReset?.();
    applyView(nextScale, centered);
    onViewChange?.({ scale: nextScale, offset: centered });
    el.focus({ preventScroll: true });
  };

  const wheelAccRef = useRef<number>(0);
  const wheelRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enableControls) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const sensitivity = ev.ctrlKey ? 0.002 : 0.0012;
      wheelAccRef.current += ev.deltaY * sensitivity;
      if (wheelRafRef.current) return;
      wheelRafRef.current = requestAnimationFrame(() => {
        wheelRafRef.current = null;
        const rawFactor = Math.exp(-wheelAccRef.current);
        wheelAccRef.current = 0;
        const factor = Math.min(1.6, Math.max(0.625, rawFactor));
        zoomByFactor(factor);
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enableControls]);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchBaseRef = useRef<{
    baseScale: number;
    baseOffset: { x: number; y: number };
    baseDistance: number;
  } | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    lastTs: number;
    vx: number;
    vy: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [dragIndicator, setDragIndicator] = useState<{ active: boolean; angle: number; strength: number }>({
    active: false,
    angle: 0,
    strength: 0,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if ((e.target as HTMLElement | null)?.closest?.('[data-worldmap-controls]')) return;
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    stopInertia();
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const arr = Array.from(pointersRef.current.values());
      const dx = arr[0].x - arr[1].x;
      const dy = arr[0].y - arr[1].y;
      pinchBaseRef.current = {
        baseScale: scaleRef.current,
        baseOffset: offsetRef.current,
        baseDistance: Math.max(1, Math.hypot(dx, dy)),
      };
      dragRef.current = null;
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      return;
    }

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTs: performance.now(),
        vx: 0,
        vy: 0,
        dx: 0,
        dy: 0,
      };
      setDragIndicator({ active: true, angle: 0, strength: 0 });
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const base = pinchBaseRef.current;
      if (!base) return;

      const arr = Array.from(pointersRef.current.values());
      const dx = arr[0].x - arr[1].x;
      const dy = arr[0].y - arr[1].y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const ratio = distance / base.baseDistance;
      const nextScale = clampScale(base.baseScale * ratio);

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = rect.width / 2;
      const py = rect.height / 2;
      const k = base.baseScale > 0 ? nextScale / base.baseScale : 1;

      const nextOffset = {
        x: px - (px - base.baseOffset.x) * k,
        y: py - (py - base.baseOffset.y) * k,
      };

      applyView(nextScale, clampOffset(nextOffset, nextScale));
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTs);
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastTs = now;
    drag.dx = dx;
    drag.dy = dy;
    drag.vx = (dx / dt) * (1000 / 60);
    drag.vy = (dy / dt) * (1000 / 60);

    const prev = offsetRef.current;
    const next = clampOffset({ x: prev.x + dx, y: prev.y + dy }, scaleRef.current);
    applyView(scaleRef.current, next);

    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    const strength = Math.min(1, Math.hypot(dx, dy) / 24);
    setDragIndicator({ active: true, angle, strength });
  };

  const onPointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    const wasPinching = pointersRef.current.size === 2;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchBaseRef.current = null;
    }

    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      dragRef.current = null;
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      const vx = drag.vx;
      const vy = drag.vy;
      onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
      if (Math.abs(vx) + Math.abs(vy) >= 0.8) startInertia(vx, vy);
    }

    if (wasPinching && pointersRef.current.size < 2) {
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if (e.key === '+' || e.key === '=' ) {
      e.preventDefault();
      zoomByFactor(BUTTON_ZOOM_FACTOR);
      return;
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomByFactor(1 / BUTTON_ZOOM_FACTOR);
      return;
    }
    if (e.key === '0') {
      e.preventDefault();
      resetView();
    }
  };

  // 地图原始尺寸常量
  const MAP_WIDTH = 1016;
  const MAP_HEIGHT = 560;

  // 这里的偏移量用于手动校准标点位置
  const mapOffsetX = -30; 
  const mapOffsetY = 66;

  // Colors based on theme
  const colors = {
    grid: isDark ? '#334155' : '#f1f5f9',
    hub: '#ef4444',
    origin: '#3b82f6',
    destination: '#10b981',
    routeStroke: isDark ? 'url(#routeGradientDark)' : '#3b82f6',
    planeFill: isDark ? '#60a5fa' : '#2563eb',
    mapOpacity: isDark ? 0.4 : 0.3,
    mapFilter: isDark ? 'invert(1) brightness(2) contrast(0.6) hue-rotate(180deg)' : 'none'
  };

  const getPointColor = (type: string) => {
    if (type === 'hub') return colors.hub;
    if (type === 'origin') return colors.origin;
    if (type === 'destination') return colors.destination;
    return '#eab308';
  };

  const renderGrid = () => {
    const lines = [];
    // 扩展网格范围以覆盖 viewBox 区域
    for (let i = -500; i < 1600; i += 50) {
      lines.push(<line key={`v-${i}`} x1={i} y1="-300" x2={i} y2="1200" stroke={colors.grid} strokeWidth="1" opacity={isDark ? 0.1 : 1} />);
    }
    for (let i = -300; i < 1200; i += 50) {
      lines.push(<line key={`h-${i}`} x1="-500" y1={i} x2="1600" y2={i} stroke={colors.grid} strokeWidth="1" opacity={isDark ? 0.1 : 1} />);
    }
    return lines;
  };

  // 投影算法 (基于 1016x514)
  const project = (lat: number, lng: number) => {
    // X轴: -180 ~ 180 => 0 ~ 1009
    const x = ((lng + 180) * MAP_WIDTH) / 360 + mapOffsetX;
    
    // Y轴: 90 ~ -90 => 0 ~ 665
    const y = ((-lat + 90) * MAP_HEIGHT) / 180 + mapOffsetY;
    
    return { x, y }; 
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
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      onKeyDown={onKeyDown}
    >
      {/* 
        ViewBox 调整说明:
        - 宽度 1250 / 高度 800: 保持放大效果 (1.5倍左右)。
        - 起点 (-150, -110): 
          Y = -110 是关键。地图图片高度 665，中心点约 332。
          ViewBox 高度 800，中心点 400。
          (332 - 400) ≈ -68。取 -110 可以让地图在垂直方向上绝对居中。
          这样可以确保顶部（北极圈）和底部（澳大利亚/新西兰）都包含在视口内。
      */}
      <svg 
        viewBox="-150 -20 1250 800" 
        className="w-full h-full block"
        preserveAspectRatio={effectivePreserveAspectRatio}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: enableControls ? 'transform' : undefined,
        }}
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
        </defs>

        {/* Background Grid */}
        {showGrid && renderGrid()}
        
        <image 
            href={worldMapSvg}
            x="0" 
            y="0" 
            width={MAP_WIDTH} 
            height={MAP_HEIGHT}
            opacity={colors.mapOpacity}
            className="pointer-events-none"
            style={{ filter: colors.mapFilter }}
        />

        {/* Routes Rendering */}
        {routes && routes.map((route, idx) => {
           const startPoint = points.find(p => p.id === route.from);
           const endPoint = points.find(p => p.id === route.to);
           if (!startPoint || !endPoint) return null;
           
           const start = project(startPoint.lat, startPoint.lng);
           const end = project(endPoint.lat, endPoint.lng);

           const midX = (start.x + end.x) / 2;
           // 曲线控制点
           const midY = Math.min(start.y, end.y) - 150;

           const pathD = `M${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

           return (
             <g key={`route-special-${idx}`}>
               <path
                 d={pathD}
                 fill="none"
                 stroke={colors.routeStroke}
                 strokeWidth="2"
                 strokeLinecap="round"
                 opacity="0.3"
               />

               <path
                 d={pathD}
                 fill="none"
                 stroke={colors.routeStroke}
                 strokeWidth="3"
                 strokeLinecap="round"
                 strokeDasharray="10, 20"
                 opacity="0.8"
                 filter={isDark ? "url(#glow)" : ""}
               >
                  {!enableControls && (
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                  )}
               </path>
               {!enableControls && (
                 <circle r="4" fill={colors.planeFill} filter={isDark ? "url(#glow)" : ""}>
                   <animateMotion dur="3s" repeatCount="indefinite" path={pathD} rotate="auto">
                     <mpath href={`#routePath-${idx}`} />
                   </animateMotion>
                 </circle>
               )}
               
               <path id={`routePath-${idx}`} d={pathD} fill="none" stroke="none" />
             </g>
           );
        })}

        {/* Normal Mode Radiation Lines */}
        {!routes && points.filter(p => p.type === 'normal').map((target, idx) => {
            const hub = points.find(p => p.type === 'hub') || points[0];
            const start = project(hub.lat, hub.lng);
            const end = project(target.lat, target.lng);
            return (
                <path
                    key={`line-${idx}`}
                    d={`M${start.x} ${start.y} Q ${(start.x + end.x)/2} ${Math.min(start.y, end.y) - 50} ${end.x} ${end.y}`}
                    fill="none"
                    stroke={target.type === 'hub' ? '#ef4444' : '#3b82f6'}
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    strokeDasharray="5,5"
                >
                    {!enableControls && (
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                    )}
                </path>
            );
        })}

        {/* Points */}
        {points.map((point) => {
          const { x, y } = project(point.lat, point.lng);
          const isLarge = point.type === 'hub' || point.type === 'origin' || point.type === 'destination';
          
          const pointColor = getPointColor(point.type);

          return (
            <g 
              key={point.id} 
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 10 });
                setHoveredPoint(point);
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r={isLarge ? 15 : 8} fill={pointColor} opacity={isDark ? 0.6 : 0.3}>
                {!enableControls && (
                  <>
                    <animate attributeName="r" values={isLarge ? "10;25;10" : "5;12;5"} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values={isDark ? "0.6;0;0.6" : "0.3;0;0.3"} dur="3s" repeatCount="indefinite" />
                  </>
                )}
              </circle>
              
              <circle 
                  cx={x} 
                  cy={y} 
                  r={isLarge ? 5 : 3} 
                  fill={pointColor} 
                  stroke={isDark ? "#fff" : "#fff"} 
                  strokeWidth="1.5"
                  filter={isDark ? "url(#glow)" : ""}
              />
              
              {(point.type === 'origin' || point.type === 'destination') && (
                 <text 
                    x={x} 
                    y={y + 25} 
                    textAnchor="middle" 
                    fill={isDark ? "#e2e8f0" : "#334155"} 
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
      </svg>

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
              onClick={() => zoomByFactor(BUTTON_ZOOM_FACTOR)}
              className={`w-11 h-11 flex items-center justify-center transition-all select-none ${isDark ? 'text-slate-100 hover:bg-white/10 active:bg-white/15' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset`}
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className={`${isDark ? 'border-t border-slate-800' : 'border-t border-gray-200'}`} />
            <button
              type="button"
              aria-label="缩小"
              disabled={scale <= effectiveMinScale}
              onClick={() => zoomByFactor(1 / BUTTON_ZOOM_FACTOR)}
              className={`w-11 h-11 flex items-center justify-center transition-all select-none ${isDark ? 'text-slate-100 hover:bg-white/10 active:bg-white/15' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset`}
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="复位"
            onClick={() => resetView()}
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
