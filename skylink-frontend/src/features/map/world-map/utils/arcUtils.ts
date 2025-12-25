export const buildArcPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
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
  return `M${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
};
