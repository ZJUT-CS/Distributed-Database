export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '').trim();
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const rgbToHex = (r: number, g: number, b: number) => {
  const to2 = (x: number) => Math.round(x).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
};

export const lerpColor = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(lerp(ca.r, cb.r, t), lerp(ca.g, cb.g, t), lerp(ca.b, cb.b, t));
};

export const getHeatColor = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { fill: '#10b981', opacity: 0.65 };
  }

  const t = clamp01((value - min) / (max - min));
  const green = '#10b981';
  const yellow = '#eab308';
  const red = '#ef4444';
  const fill = t < 0.55 ? lerpColor(green, yellow, t / 0.55) : lerpColor(yellow, red, (t - 0.55) / 0.45);
  const opacity = 0.25 + 0.55 * (1 - Math.abs(t - 0.5) * 2);
  return { fill, opacity };
};
