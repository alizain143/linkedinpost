import { extractLinkedInProfileSlug, linkedInProfileSlugsMatch } from './profile-url.util';

describe('profile-url.util', () => {
  it('extracts slug from profile URL', () => {
    expect(
      extractLinkedInProfileSlug('https://www.linkedin.com/in/Jane-Doe/'),
    ).toBe('jane-doe');
  });

  it('matches slugs case-insensitively', () => {
    expect(
      linkedInProfileSlugsMatch(
        'https://www.linkedin.com/in/jane-doe',
        'https://linkedin.com/in/Jane-Doe',
      ),
    ).toBe(true);
  });
});
