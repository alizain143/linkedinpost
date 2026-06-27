import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGenAI } from '@google/genai';
import { GoogleGenAIClientFactory } from './google-genai.client';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

describe('GoogleGenAIClientFactory', () => {
  let factory: GoogleGenAIClientFactory;
  const configService = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleGenAIClientFactory,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    factory = module.get(GoogleGenAIClientFactory);
  });

  it('is not configured without api key or project', () => {
    configService.get.mockReturnValue('');

    expect(factory.isConfigured()).toBe(false);
  });

  it('is configured with GEMINI_API_KEY', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'google.apiKey') return 'test-key';
      return '';
    });

    expect(factory.isConfigured()).toBe(true);
  });

  it('creates API key client when GEMINI_API_KEY is set', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'google.apiKey') return 'test-key';
      return '';
    });

    factory.createClient();

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
  });

  it('creates Vertex client when project is set', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'google.cloudProject') return 'my-project';
      if (key === 'google.cloudLocation') return 'us-central1';
      return '';
    });

    factory.createClient();

    expect(GoogleGenAI).toHaveBeenCalledWith({
      vertexai: true,
      project: 'my-project',
      location: 'us-central1',
    });
  });
});
