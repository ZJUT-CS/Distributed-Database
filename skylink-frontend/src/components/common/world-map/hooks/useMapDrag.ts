import { useState, useRef, useEffect } from 'react';
import type { WorldMapOffset } from './useMapViewport';

export interface UseMapDragParams {
  containerRef: React.RefObject<HTMLDivElement>;
  enableControls: boolean;
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<WorldMapOffset>;
  clampOffset: (candidate: WorldMapOffset, nextScale: number) => WorldMapOffset;
  applyView: (nextScale: number, nextOffset: WorldMapOffset) => void;
  onViewChange?: (view: { scale: number; offset: WorldMapOffset }) => void;
  triggerElastic: (dx: number, dy: number) => void;
}

export function useMapDrag({
  containerRef,
  enableControls,
  scaleRef,
  offsetRef,
  clampOffset,
  applyView,
  onViewChange,
  triggerElastic,
}: UseMapDragParams) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndicator, setDragIndicator] = useState<{ active: boolean; angle: number; strength: number }>({
    active: false,
    angle: 0,
    strength: 0,
  });

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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if ((e.target as HTMLElement | null)?.closest?.('[data-worldmap-controls]')) return;
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
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
      const nextScale = Math.min(3, Math.max(0.5, base.baseScale * ratio));

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

    triggerElastic(dx * 0.3, dy * 0.3);
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
    }

    if (wasPinching && pointersRef.current.size < 2) {
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      setIsDragging(false);
      onViewChange?.({ scale: scaleRef.current, offset: offsetRef.current });
    }
  };

  return {
    isDragging,
    dragIndicator,
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerUpOrCancel,
    onPointerCancel: onPointerUpOrCancel,
  };
}
