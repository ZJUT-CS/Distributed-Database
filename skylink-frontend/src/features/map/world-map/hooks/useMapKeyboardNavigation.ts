import { useCallback, useRef, useEffect } from 'react';
import type { WorldMapOffset } from './useMapViewport';

export interface UseMapKeyboardNavigationParams {
  containerRef: React.RefObject<HTMLDivElement>;
  enableControls: boolean;
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<WorldMapOffset>;
  clampOffset: (candidate: WorldMapOffset, nextScale: number) => WorldMapOffset;
  applyView: (nextScale: number, nextOffset: WorldMapOffset) => void;
  onViewChange?: (view: { scale: number; offset: WorldMapOffset }) => void;
  focusablePoints?: { id: string; x: number; y: number }[];
  onPointFocus?: (pointId: string) => void;
}

export function useMapKeyboardNavigation({
  containerRef,
  enableControls,
  scaleRef,
  offsetRef,
  clampOffset,
  applyView,
  onViewChange,
  focusablePoints,
  onPointFocus,
}: UseMapKeyboardNavigationParams) {
  const ARROW_PAN_AMOUNT = 80;
  const focusedIndexRef = useRef<number>(-1);

  const panByArrowKeys = useCallback((dx: number, dy: number) => {
    if (!enableControls) return;
    const prev = offsetRef.current;
    const next = clampOffset({ x: prev.x + dx, y: prev.y + dy }, scaleRef.current);
    applyView(scaleRef.current, next);
    onViewChange?.({ scale: scaleRef.current, offset: next });
  }, [enableControls, scaleRef, offsetRef, clampOffset, applyView, onViewChange]);

  const focusOnPoint = useCallback((pointIndex: number) => {
    if (!enableControls || !focusablePoints || focusablePoints.length === 0) return;
    if (pointIndex < 0 || pointIndex >= focusablePoints.length) return;

    const point = focusablePoints[pointIndex];
    focusedIndexRef.current = pointIndex;
    onPointFocus?.(point.id);
  }, [enableControls, focusablePoints, onPointFocus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableControls) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        panByArrowKeys(0, ARROW_PAN_AMOUNT);
        break;
      case 'ArrowDown':
        e.preventDefault();
        panByArrowKeys(0, -ARROW_PAN_AMOUNT);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        panByArrowKeys(ARROW_PAN_AMOUNT, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        panByArrowKeys(-ARROW_PAN_AMOUNT, 0);
        break;
      case 'Tab':
        e.preventDefault();
        if (focusablePoints && focusablePoints.length > 0) {
          const direction = e.shiftKey ? -1 : 1;
          const currentIndex = focusedIndexRef.current;
          const nextIndex = (currentIndex + direction + focusablePoints.length) % focusablePoints.length;
          focusOnPoint(nextIndex);
        }
        break;
    }
  }, [enableControls, panByArrowKeys, focusablePoints, focusOnPoint]);

  const resetFocusedIndex = useCallback(() => {
    focusedIndexRef.current = -1;
  }, []);

  return {
    onKeyDown: handleKeyDown,
    resetFocusedIndex,
    focusedIndex: focusedIndexRef.current,
  };
}
