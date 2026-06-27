import { Injectable } from '@nestjs/common';
import { ModelRouter } from './model-capability.types';
import { MockImageGenerationProvider } from './mock-image-generation.provider';
import { MockTextCompletionProvider } from './mock-text-completion.provider';
import { TextCompletionProvider } from './text-completion-provider.interface';
import { ImageGenerationProvider } from './image-generation-provider.interface';

@Injectable()
export class MockModelRouter implements ModelRouter {
  constructor(
    private readonly mockTextCompletionProvider: MockTextCompletionProvider,
    private readonly mockImageGenerationProvider: MockImageGenerationProvider,
  ) {}

  text(_model?: string): TextCompletionProvider {
    return this.mockTextCompletionProvider;
  }

  image(): ImageGenerationProvider {
    return this.mockImageGenerationProvider;
  }
}
