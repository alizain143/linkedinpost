import { MockImageGenerationProvider } from '../generation/llm/mock-image-generation.provider';

describe('MockImageGenerationProvider', () => {
  it('returns a PNG buffer', async () => {
    const provider = new MockImageGenerationProvider();
    const result = await provider.generate({ prompt: 'test' });

    expect(result.mimeType).toBe('image/png');
    expect(result.imageBuffer.length).toBeGreaterThan(0);
    expect(result.model).toBe('mock-image');
  });
});
