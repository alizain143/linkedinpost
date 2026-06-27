import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContextAssembler } from './context/context-assembler';
import { ContentProfileContextProvider } from './context/content-profile-context.provider';
import {
  CONTEXT_RETRIEVER,
  NoOpContextRetriever,
} from './context/context-retriever.interface';
import { DocumentContextProvider } from './context/document-context.provider';
import { GenerationInputContextProvider } from './context/generation-input-context.provider';
import { UserContextProvider } from './context/user-context.provider';
import { QuickDraftGenerator } from './flows/quick-draft.generator';
import { MODEL_ROUTER } from './llm/model-capability.types';
import { MockModelRouter } from './llm/mock-model-router';
import { MockTextCompletionProvider } from './llm/mock-text-completion.provider';
import { PromptRenderer } from './prompt-renderer';
import { QuickDraftOutputParser } from './quick-draft-output.parser';

@Module({
  imports: [PrismaModule],
  providers: [
    UserContextProvider,
    ContentProfileContextProvider,
    GenerationInputContextProvider,
    DocumentContextProvider,
    ContextAssembler,
    PromptRenderer,
    QuickDraftOutputParser,
    MockTextCompletionProvider,
    {
      provide: CONTEXT_RETRIEVER,
      useClass: NoOpContextRetriever,
    },
    {
      provide: MODEL_ROUTER,
      useClass: MockModelRouter,
    },
    QuickDraftGenerator,
  ],
  exports: [QuickDraftGenerator, ContextAssembler],
})
export class GenerationModule {}
