import { TextCompletionProvider } from './text-completion-provider.interface';

export const MODEL_ROUTER = Symbol('MODEL_ROUTER');

export interface ModelRouter {
  text(model?: string): TextCompletionProvider;
}
