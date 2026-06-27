import { TextCompletionProvider } from './text-completion-provider.interface';
import { ImageGenerationProvider } from './image-generation-provider.interface';

export const MODEL_ROUTER = Symbol('MODEL_ROUTER');

export interface ModelRouter {
  text(model?: string): TextCompletionProvider;
  image(): ImageGenerationProvider;
}
