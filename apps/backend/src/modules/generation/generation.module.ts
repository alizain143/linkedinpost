import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import googleConfig from '../../config/google.config';
import mediaConfig from '../../config/media.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarGenerationModule } from '../calendar-generation/calendar-generation.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthModule } from '../auth/auth.module';
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
import { CalendarSlotGenerator } from './flows/calendar-slot.generator';
import { TopicSuggestionsGenerator } from './flows/topic-suggestions.generator';
import { MODEL_ROUTER } from './llm/model-capability.types';
import { ConfigModelRouter } from './llm/config-model-router';
import { GoogleGenAIClientFactory } from './llm/google-genai.client';
import { GoogleImageGenerationProvider } from './llm/google-image-generation.provider';
import { MockTextCompletionProvider } from './llm/mock-text-completion.provider';
import { MockImageGenerationProvider } from './llm/mock-image-generation.provider';
import { OpenAiTextCompletionProvider } from './llm/openai-text-completion.provider';
import { PromptRenderer } from './prompt-renderer';
import { QuickDraftOutputParser } from './quick-draft-output.parser';
import { QuickDraftSingleOutputParser } from './quick-draft-single-output.parser';
import { TopicSuggestionsOutputParser } from './topic-suggestions-output.parser';
import { QuickDraftJobService } from './quick-draft-job.service';
import { TopicSuggestionsService } from './topic-suggestions.service';

@Module({
  imports: [
    ConfigModule.forFeature(googleConfig),
    ConfigModule.forFeature(mediaConfig),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => CouncilModule),
    forwardRef(() => CalendarGenerationModule),
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
    QuickDraftSingleOutputParser,
    TopicSuggestionsOutputParser,
    MockTextCompletionProvider,
    MockImageGenerationProvider,
    GoogleGenAIClientFactory,
    GoogleImageGenerationProvider,
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
    CalendarSlotGenerator,
    TopicSuggestionsGenerator,
    QuickDraftJobService,
    TopicSuggestionsService,
    GenerationJobsQueryService,
  ],
  exports: [
    QuickDraftGenerator,
    CalendarSlotGenerator,
    QuickDraftJobService,
    ContextAssembler,
    PromptRenderer,
    GenerationJobsQueryService,
    MODEL_ROUTER,
    GoogleGenAIClientFactory,
  ],
})
export class GenerationModule {}
