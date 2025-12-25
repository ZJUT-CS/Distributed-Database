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

    // PC-only: ignore multi-touch / pinch gestures.
    if (pointersRef.current.size > 1) {
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

    // PC-only: ignore multi-touch / pinch gestures.
    if (pointersRef.current.size > 1) return;

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

    triggerElastic(dx * 0.12, dy * 0.12);
  };

  const onPointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    pointersRef.current.delete(e.pointerId);

    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      dragRef.current = null;
      setDragIndicator({ active: false, angle: 0, strength: 0 });
      setIsDragging(false);
      const vx = drag.vx;
      const vy = drag.vy;
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
