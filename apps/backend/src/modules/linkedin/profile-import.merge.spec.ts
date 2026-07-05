import {
  mergeImportedProfile,
  parseExperienceText,
  withApiOnlyEnrichment,
} from './profile-import.merge';
import { LinkedInProfileData } from './linkedin.types';

describe('profile-import.merge', () => {
  const apiProfile: LinkedInProfileData = withApiOnlyEnrichment({
    memberId: 'member-1',
    fullName: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    pictureUrl: 'https://example.com/photo.jpg',
    headline: null,
    summary: null,
    currentTitle: 'Founder',
    currentCompany: 'Acme',
    profileUrl: 'https://www.linkedin.com/in/jane-doe',
    locale: 'en_US',
    positions: [
      {
        title: 'Founder',
        companyName: 'Acme',
        companyPageUrl: null,
        startedOn: { year: 2024, month: 1 },
        isCurrent: true,
      },
    ],
    education: [],
    syncedAt: '2026-01-01T00:00:00.000Z',
  });

  it('mergeImportedProfile fills headline and summary from import', () => {
    const { profile, importedFields } = mergeImportedProfile(
      apiProfile,
      'member-1',
      {
        profileUrl: 'https://www.linkedin.com/in/jane-doe',
        headline: 'Building the future of content',
        summary: 'I help founders grow on LinkedIn.',
        positions: [
          {
            title: 'CEO',
            companyName: 'Acme',
            companyPageUrl: null,
            startedOn: { year: 2020, month: 6 },
            isCurrent: true,
          },
          {
            title: 'PM',
            companyName: 'BigCo',
            companyPageUrl: null,
            startedOn: { year: 2018, month: 1 },
            isCurrent: false,
          },
        ],
      },
    );

    expect(profile.headline).toBe('Building the future of content');
    expect(profile.summary).toBe('I help founders grow on LinkedIn.');
    expect(profile.positions).toHaveLength(2);
    expect(profile.memberId).toBe('member-1');
    expect(profile.email).toBe('jane@example.com');
    expect(profile.enrichmentStatus).toBe('complete');
    expect(profile.enrichmentSource).toBe('user_import');
    expect(importedFields).toContain('headline');
    expect(importedFields).toContain('positions');
    expect(profile.currentTitle).toBe('Founder');
    expect(profile.currentCompany).toBe('Acme');
  });

  it('mergeImportedProfile fills currentCompany when base has none', () => {
    const emptyCompany = { ...apiProfile, currentTitle: null, currentCompany: null };
    const { profile } = mergeImportedProfile(emptyCompany, 'member-1', {
      profileUrl: 'https://www.linkedin.com/in/jane-doe',
      positions: [
        {
          title: 'CEO',
          companyName: 'ReadyOn AI',
          companyPageUrl: null,
          startedOn: { year: 2020, month: 6 },
          isCurrent: true,
        },
      ],
    });

    expect(profile.currentCompany).toBe('ReadyOn AI');
    expect(profile.currentTitle).toBe('CEO');
  });

  it('parseExperienceText splits lines into positions', () => {
    const positions = parseExperienceText(
      'Founder at Acme\nPM — BigCo\nDesigner',
    );

    expect(positions).toHaveLength(3);
    expect(positions[0]).toMatchObject({
      title: 'Founder',
      companyName: 'Acme',
      isCurrent: true,
    });
    expect(positions[1]).toMatchObject({
      title: 'PM',
      companyName: 'BigCo',
      isCurrent: false,
    });
  });
});
