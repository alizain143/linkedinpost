import { Injectable } from '@nestjs/common';
import { ModelRouter } from './model-capability.types';
import { MockTextCompletionProvider } from './mock-text-completion.provider';
import { TextCompletionProvider } from './text-completion-provider.interface';

@Injectable()
export class MockModelRouter implements ModelRouter {
  constructor(
    private readonly mockTextCompletionProvider: MockTextCompletionProvider,
  ) {}

  text(_model?: string): TextCompletionProvider {
    return this.mockTextCompletionProvider;
  }
}
