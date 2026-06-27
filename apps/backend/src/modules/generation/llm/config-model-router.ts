import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelRouter } from './model-capability.types';
import { GoogleGenAIClientFactory } from './google-genai.client';
import { GoogleImageGenerationProvider } from './google-image-generation.provider';
import { MockImageGenerationProvider } from './mock-image-generation.provider';
import { MockTextCompletionProvider } from './mock-text-completion.provider';
import { OpenAiTextCompletionProvider } from './openai-text-completion.provider';
import { TextCompletionProvider } from './text-completion-provider.interface';
import { ImageGenerationProvider } from './image-generation-provider.interface';

@Injectable()
export class ConfigModelRouter implements ModelRouter {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAiTextCompletionProvider: OpenAiTextCompletionProvider,
    private readonly mockTextCompletionProvider: MockTextCompletionProvider,
    private readonly mockImageGenerationProvider: MockImageGenerationProvider,
    private readonly googleImageGenerationProvider: GoogleImageGenerationProvider,
    private readonly googleGenAIClientFactory: GoogleGenAIClientFactory,
  ) {}

  text(_model?: string): TextCompletionProvider {
    const apiKey = this.configService.get<string>('openai.apiKey');
    return apiKey
      ? this.openAiTextCompletionProvider
      : this.mockTextCompletionProvider;
  }

  image(): ImageGenerationProvider {
    if (this.configService.get<boolean>('media.generationMock')) {
      return this.mockImageGenerationProvider;
    }

    if (!this.googleGenAIClientFactory.isConfigured()) {
      return this.mockImageGenerationProvider;
    }

    return this.googleImageGenerationProvider;
  }
}
