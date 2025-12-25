export interface ElasticState {
  value: number;
  velocity: number;
  target: number;
  stiffness: number;
  damping: number;
  mass: number;
}

export class ElasticPhysics {
  private states: Map<string, ElasticState> = new Map();
  private animationId: number | null = null;
  private lastTime = 0;
  private onUpdate?: (key: string, value: number) => void;

  constructor(onUpdate?: (key: string, value: number) => void) {
    this.onUpdate = onUpdate;
  }

  register(key: string, initialValue: number, config?: Partial<Pick<ElasticState, 'stiffness' | 'damping' | 'mass'>>): void {
    this.states.set(key, {
      value: initialValue,
      velocity: 0,
      target: initialValue,
      stiffness: config?.stiffness ?? 0.15,
      damping: config?.damping ?? 0.85,
      mass: config?.mass ?? 1,
    });
  }

  setTarget(key: string, target: number): void {
    const state = this.states.get(key);
    if (!state) return;
    state.target = target;
  }

  setValue(key: string, value: number): void {
    const state = this.states.get(key);
    if (!state) return;
    state.value = value;
    state.target = value;
    state.velocity = 0;
  }

  getValue(key: string): number {
    return this.states.get(key)?.value ?? 0;
  }

  getVelocity(key: string): number {
    return this.states.get(key)?.velocity ?? 0;
  }

  isSettled(key: string, threshold = 0.001): boolean {
    const state = this.states.get(key);
    if (!state) return true;
    return Math.abs(state.value - state.target) < threshold && Math.abs(state.velocity) < threshold;
  }

  private step(dt: number): boolean {
    let hasMovement = false;

    for (const [key, state] of this.states.entries()) {
      const displacement = state.target - state.value;
      const force = displacement * state.stiffness;
      const acceleration = (force - state.velocity * (1 - state.damping)) / state.mass;

      state.velocity += acceleration * dt;
      state.value += state.velocity * dt;

      if (Math.abs(displacement) > 0.001 || Math.abs(state.velocity) > 0.001) {
        hasMovement = true;
        this.onUpdate?.(key, state.value);
      }
    }

    return hasMovement;
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const deltaTime = Math.min(32, time - this.lastTime) / 16.67;
      this.lastTime = time;
      const hasMovement = this.step(deltaTime);
      if (hasMovement) {
        this.animationId = requestAnimationFrame(loop);
      } else {
        this.animationId = null;
      }
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
    this.states.clear();
  }
}

export function createSpringAnimation(
  from: number,
  to: number,
  stiffness = 0.15,
  damping = 0.85,
  mass = 1,
): (t: number) => number {
  const physics = new ElasticPhysics();
  const state: ElasticState = {
    value: from,
    velocity: 0,
    target: to,
    stiffness,
    damping,
    mass,
  };

  return (t: number) => {
    const dt = t * 60;
    const displacement = state.target - state.value;
    const force = displacement * state.stiffness;
    const acceleration = (force - state.velocity * (1 - state.damping)) / state.mass;
    state.velocity += acceleration * dt;
    state.value += state.velocity * dt;
    return state.value;
  };
}
