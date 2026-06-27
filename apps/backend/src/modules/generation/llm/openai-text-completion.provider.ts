import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { llmProviderError } from '../generation.errors';
import {
  TextCompletionRequest,
  TextCompletionResponse,
} from '../generation.types';
import { TextCompletionProvider } from './text-completion-provider.interface';

@Injectable()
export class OpenAiTextCompletionProvider implements TextCompletionProvider {
  constructor(private readonly configService: ConfigService) {}

  async complete(
    request: TextCompletionRequest,
  ): Promise<TextCompletionResponse> {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      throw llmProviderError('OpenAI API key is not configured');
    }

    const model =
      this.configService.get<string>('openai.textModel') ?? 'gpt-5.4';
    const client = new OpenAI({ apiKey });

    try {
      const response = await client.chat.completions.create({
        model,
        messages: request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        ...(request.responseFormat === 'json'
          ? { response_format: { type: 'json_object' as const } }
          : {}),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw llmProviderError('OpenAI returned an empty response');
      }

      return {
        content,
        model: response.model,
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('OpenAI returned')) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : 'OpenAI request failed';
      throw llmProviderError(message);
    }
  }
}
