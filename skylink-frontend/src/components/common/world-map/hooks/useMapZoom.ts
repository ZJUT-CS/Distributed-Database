import { useRef, useEffect } from 'react';
import type { WorldMapOffset } from './useMapViewport';

export interface UseMapZoomParams {
  containerRef: React.RefObject<HTMLDivElement>;
  enableControls: boolean;
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<WorldMapOffset>;
  clampScale: (s: number) => number;
  clampOffset: (candidate: WorldMapOffset, nextScale: number) => WorldMapOffset;
  applyView: (nextScale: number, nextOffset: WorldMapOffset) => void;
  onViewChange?: (view: { scale: number; offset: WorldMapOffset }) => void;
  stopInertia: () => void;
}

export function useMapZoom({
  containerRef,
  enableControls,
  scaleRef,
  offsetRef,
  clampScale,
  clampOffset,
  applyView,
  onViewChange,
  stopInertia,
}: UseMapZoomParams) {
  const BUTTON_ZOOM_FACTOR = 1.1;

  const zoomByFactorAt = (factor: number, px: number, py: number) => {
    if (!enableControls) return;
    stopInertia();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const anchorX = Math.min(rect.width, Math.max(0, px));
    const anchorY = Math.min(rect.height, Math.max(0, py));

    const prevScale = scaleRef.current;
    const nextScale = clampScale(prevScale * factor);
    const prevOffset = offsetRef.current;
    const k = prevScale > 0 ? nextScale / prevScale : 1;
    const nextOffset = {
      x: anchorX - (anchorX - prevOffset.x) * k,
      y: anchorY - (anchorY - prevOffset.y) * k,
    };
    const clamped = clampOffset(nextOffset, nextScale);
    applyView(nextScale, clamped);
    onViewChange?.({ scale: nextScale, offset: clamped });
  };

  const zoomByFactor = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    zoomByFactorAt(factor, rect.width / 2, rect.height / 2);
  };

  const focusOnPoint = (pointX: number, pointY: number, targetScale?: number) => {
    if (!enableControls) return;
    stopInertia();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const finalScale = clampScale(targetScale ?? 2);
    const prevScale = scaleRef.current;
    const prevOffset = offsetRef.current;

    const px = rect.width / 2;
    const py = rect.height / 2;

    const nextOffset = {
      x: px - (pointX - prevOffset.x / prevScale) * finalScale,
      y: py - (pointY - prevOffset.y / prevScale) * finalScale,
    };

    const clamped = clampOffset(nextOffset, finalScale);
    applyView(finalScale, clamped);
    onViewChange?.({ scale: finalScale, offset: clamped });
  };

  const wheelAccRef = useRef<number>(0);
  const wheelRafRef = useRef<number | null>(null);
  const wheelAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!enableControls) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = el.getBoundingClientRect();
      wheelAnchorRef.current = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };
      const sensitivity = ev.ctrlKey ? 0.002 : 0.0012;
      wheelAccRef.current += ev.deltaY * sensitivity;
      if (wheelRafRef.current) return;
      wheelRafRef.current = requestAnimationFrame(() => {
        wheelRafRef.current = null;
        const rawFactor = Math.exp(-wheelAccRef.current);
        wheelAccRef.current = 0;
        const factor = Math.min(1.6, Math.max(0.625, rawFactor));
        const { x, y } = wheelAnchorRef.current;
        zoomByFactorAt(factor, x, y);
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef, enableControls]);

  return {
    zoomIn: () => zoomByFactor(BUTTON_ZOOM_FACTOR),
    zoomOut: () => zoomByFactor(1 / BUTTON_ZOOM_FACTOR),
    focusOnPoint,
  };
}
