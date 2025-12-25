import { useState, useRef, useEffect } from 'react';

export interface ElasticState {
  deformationX: number;
  deformationY: number;
  hoverScale: number;
}

export function useMapElastic() {
  // Softer rebound: lower stiffness + clamp max deformation.
  const SPRING_STIFFNESS = 0.07;
  const SPRING_DAMPING = 0.8;
  const HOVER_SPRING_STIFFNESS = 0.2;
  const HOVER_SPRING_DAMPING = 0.85;
  const MAX_DEFORMATION_PX = 18;

  const [elastic, setElastic] = useState<ElasticState>({
    deformationX: 0,
    deformationY: 0,
    hoverScale: 1,
  });
  const elasticRef = useRef<ElasticState>({ deformationX: 0, deformationY: 0, hoverScale: 1 });
  const elasticVelRef = useRef<{ dx: number; dy: number; dScale: number }>({ dx: 0, dy: 0, dScale: 0 });

  useEffect(() => {
    elasticRef.current = elastic;
  }, [elastic]);

  const elasticRafRef = useRef<number | null>(null);

  const updateElastic = () => {
    const ev = elasticVelRef;
    const e = elasticRef;

    const targetDx = 0;
    const targetDy = 0;
    const targetScale = 1;

    const forceDx = (targetDx - e.current.deformationX) * SPRING_STIFFNESS;
    const forceDy = (targetDy - e.current.deformationY) * SPRING_STIFFNESS;
    const forceScale = (targetScale - e.current.hoverScale) * HOVER_SPRING_STIFFNESS;

    ev.current.dx += forceDx;
    ev.current.dy += forceDy;
    ev.current.dScale += forceScale;

    ev.current.dx *= SPRING_DAMPING;
    ev.current.dy *= SPRING_DAMPING;
    ev.current.dScale *= HOVER_SPRING_DAMPING;

    const nextDx = Math.max(-MAX_DEFORMATION_PX, Math.min(MAX_DEFORMATION_PX, e.current.deformationX + ev.current.dx));
    const nextDy = Math.max(-MAX_DEFORMATION_PX, Math.min(MAX_DEFORMATION_PX, e.current.deformationY + ev.current.dy));
    const nextScale = e.current.hoverScale + ev.current.dScale;

    e.current.deformationX = nextDx;
    e.current.deformationY = nextDy;
    e.current.hoverScale = Math.max(1, nextScale);

    setElastic({
      deformationX: nextDx,
      deformationY: nextDy,
      hoverScale: Math.max(1, nextScale),
    });

    const isResting =
      Math.abs(ev.current.dx) < 0.01 &&
      Math.abs(ev.current.dy) < 0.01 &&
      Math.abs(ev.current.dScale) < 0.001 &&
      Math.abs(e.current.deformationX) < 0.01 &&
      Math.abs(e.current.deformationY) < 0.01 &&
      Math.abs(e.current.hoverScale - 1) < 0.01;

    if (!isResting) {
      elasticRafRef.current = requestAnimationFrame(updateElastic);
    } else {
      elasticRafRef.current = null;
      e.current = { deformationX: 0, deformationY: 0, hoverScale: 1 };
      ev.current = { dx: 0, dy: 0, dScale: 0 };
      setElastic({ deformationX: 0, deformationY: 0, hoverScale: 1 });
    }
  };

  const triggerElastic = (dx: number, dy: number, scaleChange = 0) => {
    elasticVelRef.current.dx += dx;
    elasticVelRef.current.dy += dy;
    elasticVelRef.current.dScale += scaleChange;
    if (!elasticRafRef.current) {
      elasticRafRef.current = requestAnimationFrame(updateElastic);
    }
  };

  const triggerHoverScale = (targetScale: number) => {
    const scaleChange = targetScale - 1;
    triggerElastic(0, 0, scaleChange);
  };

  useEffect(() => {
    return () => {
      if (elasticRafRef.current) cancelAnimationFrame(elasticRafRef.current);
    };
  }, []);

  return {
    elastic,
    triggerElastic,
    triggerHoverScale,
  };
}
