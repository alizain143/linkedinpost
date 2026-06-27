import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelRouter } from './model-capability.types';
import { MockTextCompletionProvider } from './mock-text-completion.provider';
import { OpenAiTextCompletionProvider } from './openai-text-completion.provider';
import { TextCompletionProvider } from './text-completion-provider.interface';

@Injectable()
export class ConfigModelRouter implements ModelRouter {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAiTextCompletionProvider: OpenAiTextCompletionProvider,
    private readonly mockTextCompletionProvider: MockTextCompletionProvider,
  ) {}

  text(_model?: string): TextCompletionProvider {
    const apiKey = this.configService.get<string>('openai.apiKey');
    return apiKey
      ? this.openAiTextCompletionProvider
      : this.mockTextCompletionProvider;
  }
}
