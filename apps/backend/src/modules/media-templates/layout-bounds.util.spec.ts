import { clampElement, clampLayout } from './layout-bounds.util';
import { MediaTemplateLayout } from './layout.types';

describe('layout-bounds.util', () => {
  const canvas = { width: 1080, height: 1080 };

  it('clamps visual_zone inside canvas', () => {
    const el = clampElement(
      {
        id: 'visual',
        type: 'visual_zone',
        x: -476,
        y: 444,
        w: 920,
        h: 500,
      },
      canvas.width,
      canvas.height,
    );

    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.y).toBeGreaterThanOrEqual(0);
    expect(el.x + el.w).toBeLessThanOrEqual(canvas.width);
    expect(el.y + el.h).toBeLessThanOrEqual(canvas.height);
  });

  it('enforces minimum visual_zone size', () => {
    const el = clampElement(
      {
        id: 'visual',
        type: 'visual_zone',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
      },
      canvas.width,
      canvas.height,
    );

    expect(el.w).toBeGreaterThanOrEqual(64);
    expect(el.h).toBeGreaterThanOrEqual(64);
  });

  it('clamps avatar position and size', () => {
    const el = clampElement(
      {
        id: 'avatar',
        type: 'avatar',
        x: 1100,
        y: 1100,
        size: 48,
        bind: 'profile.avatar',
      },
      canvas.width,
      canvas.height,
    );

    expect(el.x + el.size).toBeLessThanOrEqual(canvas.width);
    expect(el.y + el.size).toBeLessThanOrEqual(canvas.height);
  });

  it('clamps all elements in layout', () => {
    const layout: MediaTemplateLayout = {
      version: 1,
      background: { color: '#FFFFFF' },
      elements: [
        {
          id: 'visual',
          type: 'visual_zone',
          x: -100,
          y: 900,
          w: 1200,
          h: 300,
        },
      ],
    };

    const clamped = clampLayout(layout, canvas.width, canvas.height);
    const zone = clamped.elements[0];
    expect(zone.x).toBeGreaterThanOrEqual(0);
    expect(zone.y).toBeGreaterThanOrEqual(0);
    expect(zone.x + zone.w).toBeLessThanOrEqual(canvas.width);
    expect(zone.y + zone.h).toBeLessThanOrEqual(canvas.height);
  });
});
