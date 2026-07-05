import {
  CarouselMediaTemplateLayout,
  MediaTemplateLayout,
  ResolvedMediaTemplate,
  SYSTEM_CAROUSEL_IDENTITY_PRESET_ID,
} from '../layout.types';
import { IDENTITY_CARD_LAYOUT } from './identity-card.preset';

const CAROUSEL_NAV_STYLE = {
  fontFamily: 'Inter',
  fontSize: 18,
  fontWeight: 600,
  color: '#0056D2',
  align: 'right' as const,
  lineHeight: 1.2,
};

function withCarouselNav(
  layout: MediaTemplateLayout,
  label = 'Swipe →',
): MediaTemplateLayout {
  return {
    ...layout,
    elements: [
      ...layout.elements,
      {
        id: 'carousel_nav',
        type: 'carousel_nav' as const,
        x: 820,
        y: 1020,
        label,
        style: CAROUSEL_NAV_STYLE,
      },
    ],
  };
}

/** Cover slide — hook-focused with avatar chrome and swipe cue. */
const CAROUSEL_FIRST_LAYOUT: MediaTemplateLayout = {
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
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        color: '#0A0A0A',
        align: 'left',
        lineHeight: 1.2,
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
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 500,
        color: '#0A0A0A',
        align: 'right',
        lineHeight: 1.2,
      },
    },
    {
      id: 'headline',
      type: 'post_headline',
      x: 64,
      y: 180,
      w: 952,
      style: {
        fontFamily: 'Inter',
        fontSize: 56,
        fontWeight: 800,
        color: '#0A0A0A',
        align: 'center',
        lineHeight: 1.1,
        highlightColor: '#0056D2',
      },
    },
    {
      id: 'subhead',
      type: 'post_subhead',
      x: 100,
      y: 380,
      w: 880,
      style: {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 400,
        color: '#3F3F46',
        align: 'center',
        lineHeight: 1.35,
      },
    },
    {
      id: 'visual',
      type: 'visual_zone',
      x: 80,
      y: 480,
      w: 920,
      h: 460,
    },
    {
      id: 'carousel_nav',
      type: 'carousel_nav',
      x: 820,
      y: 1020,
      label: 'Swipe →',
      style: CAROUSEL_NAV_STYLE,
    },
  ],
};

/** Middle slides — identity card layout with swipe cue. */
const CAROUSEL_MIDDLE_LAYOUT = withCarouselNav(IDENTITY_CARD_LAYOUT);

/** Last slide — CTA/recap, no swipe nav. */
const CAROUSEL_LAST_LAYOUT: MediaTemplateLayout = {
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
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        color: '#0A0A0A',
        align: 'left',
        lineHeight: 1.2,
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
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 500,
        color: '#0A0A0A',
        align: 'right',
        lineHeight: 1.2,
      },
    },
    {
      id: 'headline',
      type: 'post_headline',
      x: 80,
      y: 160,
      w: 920,
      style: {
        fontFamily: 'Inter',
        fontSize: 44,
        fontWeight: 800,
        color: '#0A0A0A',
        align: 'center',
        lineHeight: 1.15,
        highlightColor: '#0056D2',
      },
    },
    {
      id: 'subhead',
      type: 'post_subhead',
      x: 120,
      y: 300,
      w: 840,
      style: {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 400,
        color: '#3F3F46',
        align: 'center',
        lineHeight: 1.35,
      },
    },
    {
      id: 'visual',
      type: 'visual_zone',
      x: 80,
      y: 400,
      w: 920,
      h: 520,
    },
    {
      id: 'footer_cta',
      type: 'text',
      x: 64,
      y: 980,
      w: 952,
      bind: 'static',
      value: 'Follow for more · Save this post',
      style: {
        fontFamily: 'Inter',
        fontSize: 22,
        fontWeight: 600,
        color: '#0056D2',
        align: 'center',
        lineHeight: 1.2,
      },
    },
  ],
};

export const CAROUSEL_IDENTITY_LAYOUT: CarouselMediaTemplateLayout = {
  version: 2,
  kind: 'carousel',
  pages: {
    first: CAROUSEL_FIRST_LAYOUT,
    middle: CAROUSEL_MIDDLE_LAYOUT,
    last: CAROUSEL_LAST_LAYOUT,
  },
};

export function getSystemCarouselIdentityPreset(): ResolvedMediaTemplate {
  return {
    id: SYSTEM_CAROUSEL_IDENTITY_PRESET_ID,
    name: 'Carousel Identity',
    description:
      'Multi-slide carousel with cover, identity-card middle slides, and CTA last slide.',
    width: 1080,
    height: 1080,
    layout: CAROUSEL_IDENTITY_LAYOUT,
    isSystem: true,
    workspaceId: null,
  };
}
