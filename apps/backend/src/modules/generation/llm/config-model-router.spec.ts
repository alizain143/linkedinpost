import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModelRouter } from './config-model-router';
import { GoogleGenAIClientFactory } from './google-genai.client';
import { GoogleImageGenerationProvider } from './google-image-generation.provider';
import { MockImageGenerationProvider } from './mock-image-generation.provider';
import { MockTextCompletionProvider } from './mock-text-completion.provider';
import { OpenAiTextCompletionProvider } from './openai-text-completion.provider';

describe('ConfigModelRouter', () => {
  let router: ConfigModelRouter;
  const configService = { get: jest.fn() };
  const mockImage = { generate: jest.fn() };
  const googleImage = { generate: jest.fn() };
  const googleGenAIClientFactory = { isConfigured: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigModelRouter,
        { provide: ConfigService, useValue: configService },
        { provide: OpenAiTextCompletionProvider, useValue: {} },
        { provide: MockTextCompletionProvider, useValue: {} },
        { provide: MockImageGenerationProvider, useValue: mockImage },
        { provide: GoogleImageGenerationProvider, useValue: googleImage },
        {
          provide: GoogleGenAIClientFactory,
          useValue: googleGenAIClientFactory,
        },
      ],
    }).compile();

    router = module.get(ConfigModelRouter);
  });

  it('returns mock image provider when MEDIA_GENERATION_MOCK is true', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'media.generationMock') return true;
      return undefined;
    });

    expect(router.image()).toBe(mockImage);
  });

  it('returns mock image provider when Google is not configured', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'media.generationMock') return false;
      return undefined;
    });
    googleGenAIClientFactory.isConfigured.mockReturnValue(false);

    expect(router.image()).toBe(mockImage);
  });

  it('returns Google image provider when mock is off and creds exist', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'media.generationMock') return false;
      return undefined;
    });
    googleGenAIClientFactory.isConfigured.mockReturnValue(true);

    expect(router.image()).toBe(googleImage);
  });
});
