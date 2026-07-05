export interface LayoutGradient {
  from: string;
  to: string;
  /** Degrees, 0 = left→right, 90 = top→bottom, 180 = bottom→top */
  angle?: number;
}

export function parseLayoutGradient(raw: unknown): LayoutGradient | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.from !== 'string' || typeof obj.to !== 'string') return undefined;
  return {
    from: obj.from,
    to: obj.to,
    angle: typeof obj.angle === 'number' ? obj.angle : 180,
  };
}

/** CSS linear-gradient for React preview */
export function gradientToCss(gradient: LayoutGradient): string {
  const angle = gradient.angle ?? 180;
  return `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`;
}

/** SVG linearGradient x1/y1/x2/y2 from angle (top→bottom default) */
export function gradientToSvgCoords(angle = 180): {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
} {
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  return {
    x1: `${50 - x * 50}%`,
    y1: `${50 - y * 50}%`,
    x2: `${50 + x * 50}%`,
    y2: `${50 + y * 50}%`,
  };
}
