import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Modality } from '@google/genai';
import { GoogleGenAIClientFactory } from './google-genai.client';
import { GoogleImageGenerationProvider } from './google-image-generation.provider';

describe('GoogleImageGenerationProvider', () => {
  let provider: GoogleImageGenerationProvider;
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'google.imageModel') return 'gemini-3.1-flash-image';
      return undefined;
    }),
  };
  const googleGenAIClientFactory = {
    createClient: jest.fn(),
  };

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  beforeEach(async () => {
    jest.clearAllMocks();

    googleGenAIClientFactory.createClient.mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
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
        }),
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleImageGenerationProvider,
        { provide: ConfigService, useValue: configService },
        {
          provide: GoogleGenAIClientFactory,
          useValue: googleGenAIClientFactory,
        },
      ],
    }).compile();

    provider = module.get(GoogleImageGenerationProvider);
  });

  it('generates image bytes from Nano Banana model response', async () => {
    const result = await provider.generate({
      prompt: 'Navy quote card with bold headline',
      width: 1200,
      height: 630,
    });

    expect(result.mimeType).toBe('image/png');
    expect(result.model).toBe('gemini-3.1-flash-image');
    expect(result.imageBuffer.length).toBeGreaterThan(0);

    const client = googleGenAIClientFactory.createClient.mock.results[0].value;
    expect(client.models.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.1-flash-image',
        config: { responseModalities: [Modality.IMAGE] },
      }),
    );
  });

  it('throws LLM_PROVIDER_ERROR when response has no image', async () => {
    googleGenAIClientFactory.createClient.mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          candidates: [{ content: { parts: [{ text: 'blocked' }] } }],
        }),
      },
    });

    await expect(
      provider.generate({ prompt: 'test prompt' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
