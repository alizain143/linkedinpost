export type LayoutGradient = {
  from: string;
  to: string;
  angle?: number;
};

export function gradientToCss(gradient: LayoutGradient): string {
  const angle = gradient.angle ?? 180;
  return `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`;
}

export function resolveBackgroundStyle(background: {
  color: string;
  gradient?: LayoutGradient;
}): string {
  if (background.gradient) {
    return gradientToCss(background.gradient);
  }
  return background.color;
}

export function resolveRectFill(el: {
  fill: string;
  gradient?: LayoutGradient;
}): string {
  if (el.gradient) {
    return gradientToCss(el.gradient);
  }
  return el.fill;
}
