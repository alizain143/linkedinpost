import { resolveTemplateProfile } from './template-profile-resolver';

describe('resolveTemplateProfile', () => {
  it('prefers LinkedIn identity fields over Clerk user', () => {
    const resolved = resolveTemplateProfile({
      linkedInProfile: {
        memberId: 'li-1',
        fullName: 'Jane LinkedIn',
        firstName: 'Jane',
        lastName: 'LinkedIn',
        email: null,
        pictureUrl: 'https://example.com/photo.jpg',
        headline: null,
        summary: null,
        currentTitle: 'React Developer',
        currentCompany: 'Acme',
        profileUrl: null,
        locale: null,
        positions: [],
        education: [],
        syncedAt: '2026-01-01T00:00:00.000Z',
      },
      contentProfile: {
        name: 'Content Name',
        roleTitle: 'Content Role',
        industry: 'SaaS',
      },
      user: {
        firstName: 'Clerk',
        lastName: 'User',
        profileImageUrl: 'https://example.com/clerk.jpg',
      },
    });

    expect(resolved.profileName).toBe('Jane LinkedIn');
    expect(resolved.roleTitle).toBe('React Developer');
    expect(resolved.currentCompany).toBe('Acme');
    expect(resolved.avatarUrl).toBe('https://example.com/photo.jpg');
    expect(resolved.industry).toBe('SaaS');
  });

  it('falls back to content profile and Clerk user', () => {
    const resolved = resolveTemplateProfile({
      linkedInProfile: null,
      contentProfile: {
        name: 'Content Name',
        roleTitle: 'Content Role',
      },
      user: {
        firstName: 'Clerk',
        lastName: 'User',
        profileImageUrl: 'https://example.com/clerk.jpg',
      },
    });

    expect(resolved.profileName).toBe('Content Name');
    expect(resolved.roleTitle).toBe('Content Role');
    expect(resolved.avatarUrl).toBe('https://example.com/clerk.jpg');
  });
});
