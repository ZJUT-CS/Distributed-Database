import { useCallback, useEffect, useRef, useState } from 'react';

export type WorldMapOffset = { x: number; y: number };

export interface UseMapViewportParams {
  containerRef: React.RefObject<HTMLDivElement>;
  enableControls: boolean;
  minScale: number;
  maxScale: number;
  defaultScale: number;
  defaultView?: { scale: number; offset: WorldMapOffset };
  onViewChange?: (view: { scale: number; offset: WorldMapOffset }) => void;
}

export function useMapViewport({
  containerRef,
  enableControls,
  minScale,
  maxScale,
  defaultScale,
  defaultView,
  onViewChange,
}: UseMapViewportParams) {
  const clampScale = useCallback((s: number) => Math.min(maxScale, Math.max(minScale, s)), [minScale, maxScale]);

  const [offset, setOffset] = useState<WorldMapOffset>({ x: 0, y: 0 });
  const offsetRef = useRef<WorldMapOffset>({ x: 0, y: 0 });

  const [scale, setScale] = useState<number>(() =>
    Math.min(maxScale, Math.max(minScale, defaultScale)),
  );
  const scaleRef = useRef<number>(Math.min(maxScale, Math.max(minScale, defaultScale)));

  const clampOffset = useCallback(
    (candidate: WorldMapOffset, nextScale: number) => {
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
    },
    [containerRef],
  );

  const getCenteredOffset = useCallback(
    (nextScale: number) => {
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
    },
    [containerRef],
  );

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const applyView = useCallback((nextScale: number, nextOffset: WorldMapOffset) => {
    scaleRef.current = nextScale;
    offsetRef.current = nextOffset;
    setScale(nextScale);
    setOffset(nextOffset);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setOffset((prev) => clampOffset(prev, scaleRef.current));
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, enableControls, clampOffset]);

  useEffect(() => {
    if (defaultView) return;
    const next = clampScale(defaultScale);
    scaleRef.current = next;
    setScale(next);
    setOffset((prev) => clampOffset(prev, next));
  }, [defaultScale, minScale, maxScale, defaultView, clampScale]);

  useEffect(() => {
    if (!defaultView) return;
    const nextScale = clampScale(defaultView.scale);
    const nextOffset = clampOffset(defaultView.offset, nextScale);
    applyView(nextScale, nextOffset);
  }, [defaultView, clampScale, clampOffset]);

  return {
    offset,
    scale,
    offsetRef,
    scaleRef,
    clampOffset,
    clampScale,
    getCenteredOffset,
    applyView,
    onViewChange,
  };
}
