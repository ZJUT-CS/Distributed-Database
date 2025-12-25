import React from 'react';
import { useRef } from 'react';
import { useMapViewport, type WorldMapOffset } from './hooks/useMapViewport';
import { useMapZoom } from './hooks/useMapZoom';
import { useMapDrag } from './hooks/useMapDrag';
import { useMapElastic, type ElasticState } from './hooks/useMapElastic';
import { useMapInertia } from './hooks/useMapInertia';
import { useMapKeyboardNavigation } from './hooks/useMapKeyboardNavigation';

export type WorldMapView = { scale: number; offset: WorldMapOffset };

export interface UseWorldMapControlsParams {
  enableControls: boolean;
  minScale?: number;
  maxScale?: number;
  defaultScale?: number;
  defaultView?: WorldMapView;
  onReset?: () => void;
  onViewChange?: (view: WorldMapView) => void;
  focusablePoints?: { id: string; x: number; y: number }[];
  onPointFocus?: (pointId: string) => void;
}

export interface UseWorldMapControlsResult {
  containerRef: React.RefObject<HTMLDivElement>;
  offset: WorldMapOffset;
  scale: number;
  isDragging: boolean;
  dragIndicator: { active: boolean; angle: number; strength: number };
  elastic: ElasticState;
  effectiveMinScale: number;
  effectiveMaxScale: number;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  triggerHoverScale: (scale: number) => void;
  focusOnPoint: (pointX: number, pointY: number, targetScale?: number) => void;
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
  focusablePoints,
  onPointFocus,
}: UseWorldMapControlsParams): UseWorldMapControlsResult {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const effectiveMinScale = minScale ?? 0.5;
  const effectiveMaxScale = maxScale ?? 3;
  const effectiveDefaultScale = defaultScale ?? 1;

  const viewport = useMapViewport({
    containerRef,
    enableControls,
    minScale: effectiveMinScale,
    maxScale: effectiveMaxScale,
    defaultScale: effectiveDefaultScale,
    defaultView,
    onViewChange,
  });

  const { elastic, triggerElastic, triggerHoverScale } = useMapElastic();

  const inertia = useMapInertia({
    containerRef,
    enableControls,
    scaleRef: viewport.scaleRef,
    offsetRef: viewport.offsetRef,
    clampOffset: viewport.clampOffset,
    applyView: viewport.applyView,
    onViewChange,
  });

  const zoom = useMapZoom({
    containerRef,
    enableControls,
    scaleRef: viewport.scaleRef,
    offsetRef: viewport.offsetRef,
    clampScale: viewport.clampScale,
    clampOffset: viewport.clampOffset,
    applyView: viewport.applyView,
    onViewChange,
    stopInertia: inertia.stopInertia,
  });

  const drag = useMapDrag({
    containerRef,
    enableControls,
    scaleRef: viewport.scaleRef,
    offsetRef: viewport.offsetRef,
    clampOffset: viewport.clampOffset,
    applyView: viewport.applyView,
    onViewChange,
    triggerElastic,
  });

  const keyboard = useMapKeyboardNavigation({
    containerRef,
    enableControls,
    scaleRef: viewport.scaleRef,
    offsetRef: viewport.offsetRef,
    clampOffset: viewport.clampOffset,
    applyView: viewport.applyView,
    onViewChange,
    focusablePoints,
    onPointFocus,
  });

  const resetView = () => {
    const el = containerRef.current;
    if (!el) return;
    inertia.stopInertia();
    const nextScale = defaultView ? viewport.clampScale(defaultView.scale) : viewport.clampScale(1);
    const baseOffset = defaultView ? defaultView.offset : viewport.getCenteredOffset(nextScale);
    const centered = viewport.clampOffset(baseOffset, nextScale);
    viewport.applyView(nextScale, centered);
    onViewChange?.({ scale: nextScale, offset: centered });
    onReset?.();
    el.focus({ preventScroll: true });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableControls) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoom.zoomIn();
      return;
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoom.zoomOut();
      return;
    }
    if (e.key === '0') {
      e.preventDefault();
      resetView();
      return;
    }
    keyboard.onKeyDown(e);
  };

  return {
    containerRef,
    offset: viewport.offset,
    scale: viewport.scale,
    isDragging: drag.isDragging,
    dragIndicator: drag.dragIndicator,
    elastic,
    effectiveMinScale,
    effectiveMaxScale,
    resetView,
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    triggerHoverScale,
    focusOnPoint: zoom.focusOnPoint,
    onPointerDown: drag.onPointerDown,
    onPointerMove: drag.onPointerMove,
    onPointerUp: drag.onPointerUp,
    onPointerCancel: drag.onPointerCancel,
    onKeyDown,
  };
}
