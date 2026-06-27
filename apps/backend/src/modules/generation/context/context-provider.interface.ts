import {
  GenerationContext,
  GenerationContextSlice,
  QuickDraftInput,
} from '../generation.types';

export interface ContextProvider {
  readonly order: number;
  provide(
    input: QuickDraftInput,
    accumulated: GenerationContext,
  ): Promise<GenerationContextSlice>;
}
