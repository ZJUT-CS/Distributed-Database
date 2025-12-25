import type { MapRoute } from './WorldMapRender';
import { FlightParticlePool } from './utils/objectPool';

export type Particle = {
  id: number;
  routeIndex: number;
  progress: number;
  speed: number;
  baseSize: number;
  currentSize: number;
  baseOpacity: number;
  currentOpacity: number;
  rotation: number;
  entryFadeIn: number;
  exitFadeOut: number;
  lastPosition: { x: number; y: number } | null;
};

export type RoutePoint = {
  x: number;
  y: number;
  from: string;
  to: string;
  activeFlights?: number;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
};

const PARTICLE_POOL_SIZE = 500;
let particleIdCounter = 0;

export class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private flightPool: FlightParticlePool;
  private routePoints: RoutePoint[] = [];
  private animationId: number | null = null;
  private lastTime = 0;

  constructor() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.pool.push({
        id: particleIdCounter++,
        routeIndex: -1,
        progress: 0,
        speed: 0,
        baseSize: 0,
        currentSize: 0,
        baseOpacity: 0,
        currentOpacity: 0,
        rotation: 0,
        entryFadeIn: 0,
        exitFadeOut: 0,
        lastPosition: null,
      });
    }
    this.flightPool = new FlightParticlePool(20, 100);
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Canvas 2D context not available');
    }
  }

  setRoutes(routes: MapRoute[], project: (lat: number, lng: number) => { x: number; y: number }, pointsMap?: Map<string, { x: number; y: number }>): void {
    this.routePoints = routes.map(route => {
      const from = route.from;
      const to = route.to;
      const startPoint = pointsMap?.get(from) || project(0, 0);
      const endPoint = pointsMap?.get(to) || project(0, 0);
      return {
        x: 0,
        y: 0,
        from,
        to,
        activeFlights: (route as any).activeFlights || 1,
        startPoint,
        endPoint,
      };
    });
  }

  updateRoutePoints(project: (lat: number, lng: number) => { x: number; y: number }): void {
    this.routePoints.forEach(point => {
      const p1 = project(0, 0);
      point.x = p1.x;
      point.y = p1.y;
    });
  }

  private getArcPoint(start: { x: number; y: number }, end: { x: number; y: number }, t: number): { x: number; y: number; tangentX: number; tangentY: number } {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const lift = Math.min(220, Math.max(70, dist * 0.35));
    const nx = dist === 0 ? 0 : -dy / dist;
    const ny = dist === 0 ? -1 : dx / dist;
    const cx = midX + nx * lift;
    const cy = midY + ny * lift;

    const invT = 1 - t;
    const x = invT * invT * start.x + 2 * invT * t * cx + t * t * end.x;
    const y = invT * invT * start.y + 2 * invT * t * cy + t * t * end.y;

    const tangentX = 2 * invT * (cx - start.x) + 2 * t * (end.x - cx);
    const tangentY = 2 * invT * (cy - start.y) + 2 * t * (end.y - cy);

    return { x, y, tangentX, tangentY };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  spawnParticles(): void {
    this.routePoints.forEach((route, idx) => {
      const count = Math.min(5, Math.ceil((route.activeFlights || 1) / 10));
      for (let i = 0; i < count; i++) {
        if (this.pool.length > 0) {
          const p = this.pool.pop()!;
          p.routeIndex = idx;
          p.progress = Math.random();
          p.speed = 0.0008 + Math.random() * 0.0015;
          p.baseSize = 2.5 + Math.random() * 2;
          p.currentSize = 0;
          p.baseOpacity = 0.4 + Math.random() * 0.4;
          p.currentOpacity = 0;
          p.rotation = 0;
          p.entryFadeIn = 0;
          p.exitFadeOut = 0;
          p.lastPosition = null;
          this.particles.push(p);
        }
      }
    });
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 16;
    const ENTRY_FADE_DURATION = 0.15;
    const EXIT_FADE_DURATION = 0.15;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += p.speed * dt;

      if (p.progress >= 1) {
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }

      const route = this.routePoints[p.routeIndex];
      if (!route) continue;

      const start = route.startPoint || { x: 0, y: 0 };
      const end = route.endPoint || { x: 100, y: 0 };
      const pos = this.getArcPoint(start, end, p.progress);

      if (p.lastPosition) {
        const dx = pos.x - p.lastPosition.x;
        const dy = pos.y - p.lastPosition.y;
        if (dx !== 0 || dy !== 0) {
          p.rotation = Math.atan2(dy, dx);
        }
      }
      p.lastPosition = { x: pos.x, y: pos.y };

      if (p.progress < ENTRY_FADE_DURATION) {
        p.entryFadeIn = this.easeInOutCubic(p.progress / ENTRY_FADE_DURATION);
      } else {
        p.entryFadeIn = 1;
      }

      if (p.progress > 1 - EXIT_FADE_DURATION) {
        p.exitFadeOut = this.easeOutQuad((1 - p.progress) / EXIT_FADE_DURATION);
      } else {
        p.exitFadeOut = 1;
      }

      p.currentOpacity = p.baseOpacity * p.entryFadeIn * p.exitFadeOut;

      const scaleVariation = 1 + Math.sin(p.progress * Math.PI * 2) * 0.1;
      p.currentSize = p.baseSize * scaleVariation * (0.5 + 0.5 * p.entryFadeIn);
    }
  }

  render(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      const route = this.routePoints[p.routeIndex];
      if (!route) return;

      const start = route.startPoint || { x: 0, y: 0 };
      const end = route.endPoint || { x: 100, y: 0 };
      const pos = this.getArcPoint(start, end, p.progress);

      this.ctx!.save();
      this.ctx!.translate(pos.x, pos.y);
      this.ctx!.rotate(p.rotation);

      this.ctx!.beginPath();
      this.ctx!.moveTo(p.currentSize * 1.5, 0);
      this.ctx!.lineTo(-p.currentSize, -p.currentSize * 0.6);
      this.ctx!.lineTo(-p.currentSize * 0.4, 0);
      this.ctx!.lineTo(-p.currentSize, p.currentSize * 0.6);
      this.ctx!.closePath();
      this.ctx!.fillStyle = `rgba(16, 185, 129, ${p.currentOpacity})`;
      this.ctx!.fill();

      this.ctx!.beginPath();
      this.ctx!.moveTo(p.currentSize * 1.5, 0);
      this.ctx!.lineTo(-p.currentSize * 0.3, -p.currentSize * 0.4);
      this.ctx!.lineTo(-p.currentSize * 0.3, p.currentSize * 0.4);
      this.ctx!.closePath();
      this.ctx!.fillStyle = `rgba(16, 185, 129, ${p.currentOpacity * 0.5})`;
      this.ctx!.fill();

      this.ctx!.restore();

      this.ctx!.beginPath();
      this.ctx!.arc(pos.x, pos.y, p.currentSize * 1.5, 0, Math.PI * 2);
      this.ctx!.fillStyle = `rgba(16, 185, 129, ${p.currentOpacity * 0.2})`;
      this.ctx!.fill();
    });
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const deltaTime = time - this.lastTime;
      this.lastTime = time;
      this.update(deltaTime);
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.particles = [];
    this.pool = [];
    this.routePoints = [];
    this.flightPool.clear();
  }

  getPoolStats() {
    return {
      activeParticles: this.particles.length,
      pooledParticles: this.pool.length,
      flightPoolActive: this.flightPool.activeCount,
      flightPoolPooled: this.flightPool.poolCount,
    };
  }
}
