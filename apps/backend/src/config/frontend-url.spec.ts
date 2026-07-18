import {
  frontendUrlOrigins,
  primaryFrontendUrl,
} from './frontend-url';

describe('frontend-url', () => {
  const original = process.env.FRONTEND_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = original;
    }
  });

  it('uses the first origin for link builders', () => {
    process.env.FRONTEND_URL =
      'https://linkedinpost.ai,https://www.linkedinpost.ai';
    expect(primaryFrontendUrl()).toBe('https://linkedinpost.ai');
  });

  it('keeps all origins for CORS', () => {
    process.env.FRONTEND_URL =
      'https://linkedinpost.ai,https://www.linkedinpost.ai';
    expect(frontendUrlOrigins()).toEqual([
      'https://linkedinpost.ai',
      'https://www.linkedinpost.ai',
    ]);
  });
});
