import { GenerationDocumentContext } from '../generation.types';

export const CONTEXT_RETRIEVER = Symbol('CONTEXT_RETRIEVER');

export interface ContextRetriever {
  retrieveDocuments(
    userId: string,
    workspaceId: string,
  ): Promise<GenerationDocumentContext[]>;
}

export class NoOpContextRetriever implements ContextRetriever {
  async retrieveDocuments(): Promise<GenerationDocumentContext[]> {
    return [];
  }
}
