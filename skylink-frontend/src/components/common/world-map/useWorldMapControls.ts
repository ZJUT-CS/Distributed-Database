import type React from 'react';
import { useEffect, useRef, useState } from 'react';

export type WorldMapOffset = { x: number; y: number };
export type WorldMapView = { scale: number; offset: WorldMapOffset };

export interface UseWorldMapControlsParams {
  enableControls: boolean;
  minScale?: number;
  maxScale?: number;
  defaultScale?: number;
  defaultView?: WorldMapView;
  onReset?: () => void;
  onViewChange?: (view: WorldMapView) => void;
}

export interface UseWorldMapControlsResult {
  containerRef: React.RefObject<HTMLDivElement>;
  offset: WorldMapOffset;
  scale: number;
  isDragging: boolean;
  dragIndicator: { active: boolean; angle: number; strength: number };
  effectiveMinScale: number;
  effectiveMaxScale: number;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function useWorldMapControls({
  enableControls,
  minScale,
  maxScale,
  defaultScale,
  defaultView,
  onReset,
  onViewChange,
}: UseWorldMapControlsParams): UseWorldMapControlsResult {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const effectiveMinScale = minScale ?? 0.5;
  const effectiveMaxScale = maxScale ?? 3;
  const effectiveDefaultScale = defaultScale ?? 1;

  const clampScale = (s: number) => Math.min(effectiveMaxScale, Math.max(effectiveMinScale, s));
  const BUTTON_ZOOM_FACTOR = 1.1;
  const DRAG_DECAY = 0.95;

  const [offset, setOffset] = useState<WorldMapOffset>({ x: 0, y: 0 });
  const offsetRef = useRef<WorldMapOffset>({ x: 0, y: 0 });

  const [scale, setScale] = useState<number>(() =>
    Math.min(effectiveMaxScale, Math.max(effectiveMinScale, effectiveDefaultScale)),
  );
  const scaleRef = useRef<number>(Math.min(effectiveMaxScale, Math.max(effectiveMinScale, effectiveDefaultScale)));

  const [isDragging, setIsDragging] = useState(false);
  const [dragIndicator, setDragIndicator] = useState<{ active: boolean; angle: number; strength: number }>({
    active: false,
    angle: 0,
    strength: 0,
  });

  const clampOffset = (candidate: WorldMapOffset, nextScale: number) => {
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

  const applyView = (nextScale: number, nextOffset: WorldMapOffset) => {
    scaleRef.current = nextScale;
    offsetRef.current = nextOffset;
    setScale(nextScale);
    setOffset(nextOffset);
  };

  // Clamp on container resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setOffset((prev) => clampOffset(prev, scaleRef.current));
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableControls]);

  // Sync scale defaults.
  useEffect(() => {
    if (defaultView) return;
    const next = clampScale(effectiveDefaultScale);
    scaleRef.current = next;
    setScale(next);
    setOffset((prev) => clampOffset(prev, next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDefaultScale, effectiveMinScale, effectiveMaxScale, defaultView]);

  // Apply provided default view (camera) if present.
  useEffect(() => {
    if (!defaultView) return;
    const nextScale = clampScale(defaultView.scale);
    const nextOffset = clampOffset(defaultView.offset, nextScale);
    applyView(nextScale, nextOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultView]);

  const inertiaRafRef = useRef<number | null>(null);
  const inertiaVelRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const stopInertia = () => {
    if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current);
    inertiaRafRef.current = null;
    inertiaVelRef.current = { vx: 0, vy: 0 };
  };

  useEffect(() => {
    return () => stopInertia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchBaseRef = useRef<{
    baseScale: number;
    baseOffset: WorldMapOffset;
    baseDistance: number;
    baseCenter?: { x: number; y: number };
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
    const nextScale = defaultView ? clampScale(defaultView.scale) : clampScale(1);
    const baseOffset = defaultView ? defaultView.offset : getCenteredOffset(nextScale);
    const centered = clampOffset(baseOffset, nextScale);
    pointersRef.current.clear();
    pinchBaseRef.current = null;
    dragRef.current = null;
    setDragIndicator({ active: false, angle: 0, strength: 0 });
    setIsDragging(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableControls]);

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

      const rect = el.getBoundingClientRect();
      const mx = (arr[0].x + arr[1].x) / 2;
      const my = (arr[0].y + arr[1].y) / 2;
      const baseCenter = {
        x: mx - rect.left,
        y: my - rect.top,
      };

      pinchBaseRef.current = {
        baseScale: scaleRef.current,
        baseOffset: offsetRef.current,
        baseDistance: Math.max(1, Math.hypot(dx, dy)),
        baseCenter,
      };
      dragRef.current = null;
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      setIsDragging(false);
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
      setIsDragging(true);
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

      const mx = (arr[0].x + arr[1].x) / 2;
      const my = (arr[0].y + arr[1].y) / 2;
      const px = mx - rect.left;
      const py = my - rect.top;
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

  const finalizeGesture = (wasPinching: boolean) => {
    if (wasPinching) {
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      setIsDragging(false);
      onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
    }
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
      setIsDragging(false);
      const vx = drag.vx;
      const vy = drag.vy;
      onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
      if (Math.abs(vx) + Math.abs(vy) >= 0.8) startInertia(vx, vy);
    }

    if (wasPinching && pointersRef.current.size < 2) {
      finalizeGesture(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if (e.key === '+' || e.key === '=') {
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

  return {
    containerRef,
    offset,
    scale,
    isDragging,
    dragIndicator,
    effectiveMinScale,
    effectiveMaxScale,
    resetView,
    zoomIn: () => zoomByFactor(BUTTON_ZOOM_FACTOR),
    zoomOut: () => zoomByFactor(1 / BUTTON_ZOOM_FACTOR),
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerUpOrCancel,
    onPointerCancel: onPointerUpOrCancel,
    onKeyDown,
  };
}
