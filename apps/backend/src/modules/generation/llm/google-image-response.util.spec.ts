import { extractImageFromGenerateContentResponse } from './google-image-response.util';

describe('google-image-response.util', () => {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('extracts png inline data from generateContent response', () => {
    const result = extractImageFromGenerateContentResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: pngBase64,
                },
              },
            ],
          },
        },
      ],
    } as never);

    expect(result).not.toBeNull();
    expect(result!.mimeType).toBe('image/png');
    expect(result!.buffer.length).toBeGreaterThan(0);
  });

  it('extracts jpeg inline data', () => {
    const result = extractImageFromGenerateContentResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: '/9j/4AAQ',
                },
              },
            ],
          },
        },
      ],
    } as never);

    expect(result?.mimeType).toBe('image/jpeg');
  });

  it('returns null when no supported image parts exist', () => {
    const result = extractImageFromGenerateContentResponse({
      candidates: [{ content: { parts: [{ text: 'no image' }] } }],
    } as never);

    expect(result).toBeNull();
  });
});
