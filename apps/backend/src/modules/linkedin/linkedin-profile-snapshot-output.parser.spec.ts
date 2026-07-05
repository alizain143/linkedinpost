import { LinkedInProfileSnapshotOutputParser } from './linkedin-profile-snapshot-output.parser';

describe('LinkedInProfileSnapshotOutputParser', () => {
  const parser = new LinkedInProfileSnapshotOutputParser();

  it('parses structured profile and filters placeholder education', () => {
    const result = parser.parse(
      JSON.stringify({
        headline: 'Business Development Manager at StackNovaTech',
        summary: 'I help businesses build and grow their digital presence.',
        positions: [
          {
            title: 'Business Development Manager',
            companyName: 'StackNovaTech',
            description: 'Full role description here.',
            isCurrent: true,
          },
        ],
        education: [
          { schoolName: 'School', degreeName: 'Degree, Field of Study' },
        ],
        skills: ['Sales', 'Business Development Support'],
      }),
      'https://www.linkedin.com/in/test-user',
    );

    expect(result.headline).toContain('Business Development Manager');
    expect(result.summary).toContain('digital presence');
    expect(result.positions).toHaveLength(1);
    expect(result.education).toHaveLength(0);
    expect(result.skills).toEqual(['Sales', 'Business Development Support']);
  });
});
