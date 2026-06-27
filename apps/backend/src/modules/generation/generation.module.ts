import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { CouncilModule } from '../council/council.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContextAssembler } from './context/context-assembler';
import { ContentProfileContextProvider } from './context/content-profile-context.provider';
import {
  CONTEXT_RETRIEVER,
  NoOpContextRetriever,
} from './context/context-retriever.interface';
import { DocumentContextProvider } from './context/document-context.provider';
import { GenerationInputContextProvider } from './context/generation-input-context.provider';
import { UserContextProvider } from './context/user-context.provider';
import { GenerationController } from './generation.controller';
import { GenerationJobsController } from './generation-jobs.controller';
import { GenerationJobsQueryService } from './generation-jobs-query.service';
import { QuickDraftGenerator } from './flows/quick-draft.generator';
import { MODEL_ROUTER } from './llm/model-capability.types';
import { ConfigModelRouter } from './llm/config-model-router';
import { MockTextCompletionProvider } from './llm/mock-text-completion.provider';
import { OpenAiTextCompletionProvider } from './llm/openai-text-completion.provider';
import { PromptRenderer } from './prompt-renderer';
import { QuickDraftOutputParser } from './quick-draft-output.parser';
import { QuickDraftJobService } from './quick-draft-job.service';

@Module({
  imports: [
    PrismaModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => CouncilModule),
  ],
  controllers: [GenerationController, GenerationJobsController],
  providers: [
    UserContextProvider,
    ContentProfileContextProvider,
    GenerationInputContextProvider,
    DocumentContextProvider,
    ContextAssembler,
    PromptRenderer,
    QuickDraftOutputParser,
    MockTextCompletionProvider,
    OpenAiTextCompletionProvider,
    ConfigModelRouter,
    {
      provide: CONTEXT_RETRIEVER,
      useClass: NoOpContextRetriever,
    },
    {
      provide: MODEL_ROUTER,
      useClass: ConfigModelRouter,
    },
    QuickDraftGenerator,
    QuickDraftJobService,
    GenerationJobsQueryService,
  ],
  exports: [
    QuickDraftGenerator,
    QuickDraftJobService,
    ContextAssembler,
    PromptRenderer,
    GenerationJobsQueryService,
  ],
})
export class GenerationModule {}
