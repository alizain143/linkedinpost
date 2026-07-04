import { IDENTITY_CARD_LAYOUT } from './presets/identity-card.preset';
import { renderTemplateSvg } from './template-svg.renderer';

describe('renderTemplateSvg', () => {
  it('renders identity card with profile and slot content', () => {
    const svg = renderTemplateSvg(IDENTITY_CARD_LAYOUT, 1080, 1080, {
      profileName: 'Ali Zain Shah',
      roleTitle: 'Software Engineer',
      industry: 'Tech',
      avatarUrl: null,
      slots: {
        headline: '2FA Exists Because Passwords Are Too Easy To Break.',
        headlineHighlight: 'Too Easy To Break.',
        subhead: 'It limits the damage.',
        altText: '2FA card',
      },
    });

    expect(svg).toContain('Ali Zain Shah');
    expect(svg).toContain('Software Engineer');
    expect(svg).toContain('Too Easy To Break.');
    expect(svg).toContain('Save &amp; Repost');
    expect(svg).toContain('viewBox="0 0 1080 1080"');
    // Empty visual zone renders a placeholder rect until AI inset is provided
    expect(svg).toContain('fill="#F4F4F5"');
  });

  it('embeds AI graphic data URL in visual_zone', () => {
    const svg = renderTemplateSvg(IDENTITY_CARD_LAYOUT, 1080, 1080, {
      profileName: 'Ali',
      roleTitle: 'Engineer',
      industry: 'Tech',
      slots: {
        headline: 'Headline',
        altText: 'alt',
      },
      visualZoneImages: {
        visual: 'data:image/png;base64,abc123',
      },
    });

    expect(svg).toContain('data:image/png;base64,abc123');
    expect(svg).toContain('href="data:image/png;base64,abc123"');
  });
});
