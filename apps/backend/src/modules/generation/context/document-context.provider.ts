import { Inject, Injectable } from '@nestjs/common';
import { ContextProvider } from './context-provider.interface';
import { CONTEXT_RETRIEVER } from './context-retriever.interface';
import type { ContextRetriever } from './context-retriever.interface';
import {
  GenerationContext,
  GenerationContextSlice,
  QuickDraftInput,
} from '../generation.types';

@Injectable()
export class DocumentContextProvider implements ContextProvider {
  readonly order = 40;

  constructor(
    @Inject(CONTEXT_RETRIEVER)
    private readonly contextRetriever: ContextRetriever,
  ) {}

  async provide(
    input: QuickDraftInput,
    _accumulated: GenerationContext,
  ): Promise<GenerationContextSlice> {
    const documents = await this.contextRetriever.retrieveDocuments(
      input.userId,
      input.workspaceId,
    );

    if (documents.length === 0) {
      return {};
    }

    return { documents };
  }
}
