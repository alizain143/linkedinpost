import { ContentGoal } from '@prisma/client';
import { ContentProfileSuggestOutputParser } from './content-profile-suggest-output.parser';

describe('ContentProfileSuggestOutputParser', () => {
  const parser = new ContentProfileSuggestOutputParser();

  const validProfile = {
    name: 'Authority Builder',
    roleTitle: 'CEO',
    industry: 'SaaS',
    targetAudience: 'Founders',
    contentGoal: ContentGoal.build_authority,
    preferredTone: 'Bold & punchy',
    brandPrimary: '#1a1a2e',
    brandAccent: '#5B3DF5',
    offerDescription: 'Growth platform',
    writingSample: 'Ship weekly. Learn in public.',
    avoidWords: 'leverage, synergy',
    isDefault: true,
    pillars: ['Founder lessons', 'Industry takes', 'How-to guides'],
  };

  it('parses exactly 3 profiles', () => {
    const result = parser.parse(
      JSON.stringify({
        profiles: [validProfile, { ...validProfile, name: 'Lead Gen' }, { ...validProfile, name: 'Audience' }],
      }),
    );

    expect(result.profiles).toHaveLength(3);
    expect(result.profiles[0].name).toBe('Authority Builder');
    expect(result.profiles[0].pillars).toHaveLength(3);
  });

  it('rejects wrong profile count', () => {
    expect(() =>
      parser.parse(JSON.stringify({ profiles: [validProfile] })),
    ).toThrow();
  });
});
