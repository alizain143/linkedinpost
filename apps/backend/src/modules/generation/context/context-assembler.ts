import { Injectable } from '@nestjs/common';
import { ContentProfileContextProvider } from './content-profile-context.provider';
import { ContextProvider } from './context-provider.interface';
import { DocumentContextProvider } from './document-context.provider';
import { GenerationInputContextProvider } from './generation-input-context.provider';
import { UserContextProvider } from './user-context.provider';
import { GenerationContext, QuickDraftInput } from '../generation.types';

@Injectable()
export class ContextAssembler {
  private readonly providers: ContextProvider[];

  constructor(
    userContextProvider: UserContextProvider,
    contentProfileContextProvider: ContentProfileContextProvider,
    generationInputContextProvider: GenerationInputContextProvider,
    documentContextProvider: DocumentContextProvider,
  ) {
    this.providers = [
      userContextProvider,
      contentProfileContextProvider,
      generationInputContextProvider,
      documentContextProvider,
    ].sort((a, b) => a.order - b.order);
  }

  async assemble(input: QuickDraftInput): Promise<GenerationContext> {
    let context: GenerationContext = {
      workspaceId: input.workspaceId,
      userId: input.userId,
    };

    for (const provider of this.providers) {
      const slice = await provider.provide(input, context);
      context = this.mergeContext(context, slice);
    }

    if (context.contentProfileId) {
      context = {
        ...context,
        contentProfileId: context.contentProfileId,
      };
    }

    return context;
  }

  private mergeContext(
    base: GenerationContext,
    slice: Partial<GenerationContext>,
  ): GenerationContext {
    return {
      ...base,
      ...slice,
      user: slice.user ?? base.user,
      contentProfile: slice.contentProfile ?? base.contentProfile,
      input: slice.input ? { ...base.input, ...slice.input } : base.input,
      documents: slice.documents ?? base.documents,
      contentProfileId: slice.contentProfileId ?? base.contentProfileId,
    };
  }
}
