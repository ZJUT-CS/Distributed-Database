export interface PoolableObject {
  reset: () => void;
  dispose: () => void;
}

export class ObjectPool<T extends PoolableObject> {
  private pool: T[] = [];
  private active: T[] = [];
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize = 10, maxSize = 100) {
    this.factory = factory;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.dispose();
      this.pool.push(obj);
    }
  }

  acquire(): T {
    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }
    obj.reset();
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const index = this.active.indexOf(obj);
    if (index !== -1) {
      this.active.splice(index, 1);
      if (this.pool.length < this.maxSize) {
        obj.dispose();
        this.pool.push(obj);
      } else {
        obj.dispose();
      }
    }
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      const obj = this.active.pop()!;
      if (this.pool.length < this.maxSize) {
        obj.dispose();
        this.pool.push(obj);
      } else {
        obj.dispose();
      }
    }
  }

  get activeCount(): number {
    return this.active.length;
  }

  get poolCount(): number {
    return this.pool.length;
  }

  clear(): void {
    this.releaseAll();
    this.pool.forEach(obj => obj.dispose());
    this.pool = [];
  }
}

export class ParticlePoolItem {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public scale: number = 1;
  public opacity: number = 1;
  public rotation: number = 0;
  public active: boolean = false;
  public life: number = 0;
  public maxLife: number = 0;
  public hue: number = 0;

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.scale = 1;
    this.opacity = 1;
    this.rotation = 0;
    this.active = false;
    this.life = 0;
    this.maxLife = 0;
    this.hue = 0;
  }

  dispose() {
    this.active = false;
  }
}

export class ParticlePool extends ObjectPool<ParticlePoolItem> {
  constructor(initialSize = 50, maxSize = 200) {
    super(() => new ParticlePoolItem(), initialSize, maxSize);
  }
}

export interface FlightParticle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  active: boolean;
  controlPoints: { x: number; y: number }[];
  rotation: number;
  scale: number;
  opacity: number;
  hue: number;
}

export class FlightParticlePoolItem implements PoolableObject {
  public id: string = '';
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public progress: number = 0;
  public speed: number = 0;
  public active: boolean = false;
  public controlPoints: { x: number; y: number }[] = [];
  public rotation: number = 0;
  public scale: number = 1;
  public opacity: number = 1;
  public hue: number = 0;

  reset() {
    this.id = '';
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.progress = 0;
    this.speed = 0;
    this.active = false;
    this.controlPoints = [];
    this.rotation = 0;
    this.scale = 1;
    this.opacity = 1;
    this.hue = 0;
  }

  dispose() {
    this.active = false;
    this.controlPoints = [];
  }

  initFrom(flight: FlightParticle): void {
    this.id = flight.id;
    this.x = flight.x;
    this.y = flight.y;
    this.targetX = flight.targetX;
    this.targetY = flight.targetY;
    this.progress = flight.progress;
    this.speed = flight.speed;
    this.active = flight.active;
    this.controlPoints = [...flight.controlPoints];
    this.rotation = flight.rotation;
    this.scale = flight.scale;
    this.opacity = flight.opacity;
    this.hue = flight.hue;
  }

  toFlight(): FlightParticle {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      targetX: this.targetX,
      targetY: this.targetY,
      progress: this.progress,
      speed: this.speed,
      active: this.active,
      controlPoints: [...this.controlPoints],
      rotation: this.rotation,
      scale: this.scale,
      opacity: this.opacity,
      hue: this.hue,
    };
  }
}

export class FlightParticlePool extends ObjectPool<FlightParticlePoolItem> {
  constructor(initialSize = 20, maxSize = 100) {
    super(() => new FlightParticlePoolItem(), initialSize, maxSize);
  }
}
