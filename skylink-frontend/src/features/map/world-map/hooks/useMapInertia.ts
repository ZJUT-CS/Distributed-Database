import { useRef, useEffect, useCallback } from 'react';
import type { WorldMapOffset } from './useMapViewport';

export interface UseMapInertiaParams {
  containerRef: React.RefObject<HTMLDivElement>;
  enableControls: boolean;
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<WorldMapOffset>;
  clampOffset: (candidate: WorldMapOffset, nextScale: number) => WorldMapOffset;
  applyView: (nextScale: number, nextOffset: WorldMapOffset) => void;
  onViewChange?: (view: { scale: number; offset: WorldMapOffset }) => void;
}

export function useMapInertia({
  containerRef,
  enableControls,
  scaleRef,
  offsetRef,
  clampOffset,
  applyView,
  onViewChange,
}: UseMapInertiaParams) {
  const DRAG_DECAY = 0.95;
  const inertiaRafRef = useRef<number | null>(null);
  const inertiaVelRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current);
    inertiaRafRef.current = null;
    inertiaVelRef.current = { vx: 0, vy: 0 };
  }, []);

  useEffect(() => {
    return () => stopInertia();
  }, [stopInertia]);

  const startInertia = useCallback((vx: number, vy: number) => {
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
  }, [clampOffset, scaleRef, offsetRef, applyView, onViewChange, stopInertia]);

  return {
    stopInertia,
    startInertia,
  };
}
