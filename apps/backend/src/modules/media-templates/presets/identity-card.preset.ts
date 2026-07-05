import {
  MediaTemplateLayout,
  ResolvedMediaTemplate,
  SYSTEM_IDENTITY_CARD_PRESET_ID,
} from '../layout.types';

/** Four-corner identity card with AI-filled visual zone (reference slide style). */
export const IDENTITY_CARD_LAYOUT: MediaTemplateLayout = {
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
        fontSize: 48,
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
      y: 340,
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
      y: 440,
      w: 920,
      h: 500,
    },
    {
      id: 'footer_left',
      type: 'text',
      x: 64,
      y: 1000,
      w: 480,
      bind: 'static',
      value: 'Your Brand',
      style: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 500,
        color: '#0A0A0A',
        align: 'left',
        lineHeight: 1.2,
      },
    },
    {
      id: 'footer_right',
      type: 'text',
      x: 560,
      y: 1000,
      w: 456,
      bind: 'static',
      value: 'Save & Repost',
      style: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 500,
        color: '#0A0A0A',
        align: 'right',
        lineHeight: 1.2,
      },
    },
  ],
};

export function getSystemIdentityCardPreset(): ResolvedMediaTemplate {
  return {
    id: SYSTEM_IDENTITY_CARD_PRESET_ID,
    name: 'Identity Card',
    description:
      'Four-corner identity chrome with AI-generated graphic in the center visual zone.',
    width: 1080,
    height: 1080,
    layout: IDENTITY_CARD_LAYOUT,
    isSystem: true,
    workspaceId: null,
  };
}

export const SYSTEM_PRESETS: ResolvedMediaTemplate[] = [
  getSystemIdentityCardPreset(),
];
