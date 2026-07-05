import { describe, expect, it } from '@jest/globals';
import { normalizeReferenceDraftLayout } from './reference-draft-normalizer';
import type { MediaTemplateLayout } from './layout.types';

describe('normalizeReferenceDraftLayout', () => {
  it('removes avatar and profile binds from hero-style layouts', () => {
    const layout: MediaTemplateLayout = {
      version: 1,
      background: { color: '#FFFFFF' },
      elements: [
        {
          id: 'avatar',
          type: 'avatar',
          x: 900,
          y: 900,
          size: 48,
          bind: 'profile.avatar',
        },
        {
          id: 'name',
          type: 'text',
          x: 64,
          y: 200,
          w: 300,
          bind: 'profile.name',
          style: {
            fontSize: 28,
            color: '#000000',
          },
        },
        {
          id: 'headline',
          type: 'post_headline',
          x: 64,
          y: 64,
          w: 800,
          style: {
            fontSize: 64,
            color: '#000000',
          },
        },
        {
          id: 'hero',
          type: 'visual_zone',
          x: 180,
          y: 280,
          w: 720,
          h: 500,
        },
      ],
    };

    const normalized = normalizeReferenceDraftLayout(layout, 1080, 1080);
    expect(normalized.elements.some((el) => el.type === 'avatar')).toBe(false);
    expect(
      normalized.elements.some(
        (el) => el.type === 'text' && el.bind === 'profile.name',
      ),
    ).toBe(false);
    expect(normalized.elements[0]?.type).toBe('visual_zone');
    expect(normalized.elements.at(-1)?.type).toBe('post_headline');
  });

  it('keeps identity corner layouts intact', () => {
    const layout: MediaTemplateLayout = {
      version: 1,
      background: { color: '#FFFFFF' },
      elements: [
        {
          id: 'avatar',
          type: 'avatar',
          x: 64,
          y: 56,
          size: 48,
          bind: 'profile.avatar',
        },
        {
          id: 'name',
          type: 'text',
          x: 128,
          y: 64,
          w: 400,
          bind: 'profile.name',
          style: {
            fontSize: 28,
            color: '#000000',
          },
        },
        {
          id: 'title',
          type: 'text',
          x: 560,
          y: 68,
          w: 456,
          bind: 'profile.roleTitle',
          style: {
            fontSize: 26,
            color: '#000000',
          },
        },
        {
          id: 'headline',
          type: 'post_headline',
          x: 80,
          y: 160,
          w: 920,
          style: {
            fontSize: 48,
            color: '#000000',
          },
        },
      ],
    };

    const normalized = normalizeReferenceDraftLayout(layout, 1080, 1080);
    expect(normalized.elements.some((el) => el.type === 'avatar')).toBe(true);
  });
});
