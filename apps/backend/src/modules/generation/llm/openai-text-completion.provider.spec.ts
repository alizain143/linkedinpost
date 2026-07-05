import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiTextCompletionProvider } from './openai-text-completion.provider';

const createMock = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  })),
}));

describe('OpenAiTextCompletionProvider', () => {
  let provider: OpenAiTextCompletionProvider;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiTextCompletionProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'openai.apiKey') return 'sk-test';
              if (key === 'openai.textModel') return 'gpt-5.4';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(OpenAiTextCompletionProvider);
  });

  it('throws when API key is missing', async () => {
    const module = await Test.createTestingModule({
      providers: [
        OpenAiTextCompletionProvider,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    const noKeyProvider = module.get(OpenAiTextCompletionProvider);

    await expect(
      noKeyProvider.complete({ messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'LLM_PROVIDER_ERROR' }),
    });
  });

  it('requests JSON mode and returns model metadata', async () => {
    createMock.mockResolvedValue({
      model: 'gpt-5.4',
      choices: [{ message: { content: '{"variants":[]}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    const result = await provider.complete({
      messages: [{ role: 'user', content: 'hi' }],
      responseFormat: 'json',
      maxTokens: 4096,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4',
        max_completion_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    );
    expect(createMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: expect.anything() }),
    );
    expect(result).toEqual({
      content: '{"variants":[]}',
      model: 'gpt-5.4',
      usage: { inputTokens: 10, outputTokens: 20 },
    });
  });

  it('maps OpenAI failures to LLM_PROVIDER_ERROR', async () => {
    createMock.mockRejectedValue(new Error('rate limited'));

    await expect(
      provider.complete({ messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'LLM_PROVIDER_ERROR' }),
    });
  });
});
