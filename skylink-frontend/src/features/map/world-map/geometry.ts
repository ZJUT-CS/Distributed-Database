export type ViewportSize = { width: number; height: number };

export type WorldMapOffset = { x: number; y: number };
export type WorldMapView = { scale: number; offset: WorldMapOffset };

// 地图原始尺寸常量（与 WorldMapRender 保持一致）
export const MAP_WIDTH = 1016;
export const MAP_HEIGHT = 560;

// 这里的偏移量用于手动校准标点位置（与 WorldMapRender 保持一致）
export const MAP_OFFSET_X = -30;
export const MAP_OFFSET_Y = 66;

// WorldMapRender 的 viewBox 常量（用于将 userSpace 坐标映射到像素）
export const VIEWBOX = {
  minX: -150,
  minY: -20,
  width: 1250,
  height: 800,
};

// 投影算法（与 WorldMapRender 保持一致）
export const project = (lat: number, lng: number) => {
  const x = ((lng + 180) * MAP_WIDTH) / 360 + MAP_OFFSET_X;
  const y = ((-lat + 90) * MAP_HEIGHT) / 180 + MAP_OFFSET_Y;
  return { x, y };
};

const getPreserveMode = (preserveAspectRatio: string): 'meet' | 'slice' | 'none' => {
  const v = preserveAspectRatio.toLowerCase();
  if (v.includes('none')) return 'none';
  if (v.includes('slice')) return 'slice';
  return 'meet';
};

export const mapUserToViewportPx = (
  user: { x: number; y: number },
  viewport: ViewportSize,
  preserveAspectRatio: string,
) => {
  const mode = getPreserveMode(preserveAspectRatio);

  if (mode === 'none') {
    const sx = viewport.width / VIEWBOX.width;
    const sy = viewport.height / VIEWBOX.height;
    return {
      x: (user.x - VIEWBOX.minX) * sx,
      y: (user.y - VIEWBOX.minY) * sy,
    };
  }

  const s0 =
    mode === 'slice'
      ? Math.max(viewport.width / VIEWBOX.width, viewport.height / VIEWBOX.height)
      : Math.min(viewport.width / VIEWBOX.width, viewport.height / VIEWBOX.height);

  const tx0 = (viewport.width - VIEWBOX.width * s0) / 2 - VIEWBOX.minX * s0;
  const ty0 = (viewport.height - VIEWBOX.height * s0) / 2 - VIEWBOX.minY * s0;

  return {
    x: user.x * s0 + tx0,
    y: user.y * s0 + ty0,
  };
};

export const computeAutoFitView = (params: {
  points: Array<{ lat: number; lng: number }>;
  viewport: ViewportSize;
  preserveAspectRatio: string;
  paddingPx?: number;
  maxAutoScale?: number;
}): WorldMapView => {
  const { points, viewport, preserveAspectRatio } = params;
  const paddingPx = params.paddingPx ?? 48;
  const maxAutoScale = params.maxAutoScale ?? 2.6;

  if (!viewport.width || !viewport.height || points.length === 0) {
    return { scale: 1, offset: { x: 0, y: 0 } };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const p of points) {
    const user = project(p.lat, p.lng);
    const px = mapUserToViewportPx(user, viewport, preserveAspectRatio);
    if (!Number.isFinite(px.x) || !Number.isFinite(px.y)) continue;
    minX = Math.min(minX, px.x);
    minY = Math.min(minY, px.y);
    maxX = Math.max(maxX, px.x);
    maxY = Math.max(maxY, px.y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { scale: 1, offset: { x: 0, y: 0 } };
  }

  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);

  const usableW = Math.max(1, viewport.width - paddingPx * 2);
  const usableH = Math.max(1, viewport.height - paddingPx * 2);

  const rawScale = Math.min(usableW / bboxW, usableH / bboxH);
  const scale = Math.max(1, Math.min(maxAutoScale, rawScale));

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const targetCx = viewport.width / 2;
  const targetCy = viewport.height / 2;

  const offset = {
    x: targetCx - cx * scale,
    y: targetCy - cy * scale,
  };

  return { scale, offset };
};
