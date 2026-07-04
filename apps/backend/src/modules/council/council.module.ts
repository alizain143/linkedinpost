import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import councilConfig from '../../config/council.config';
import googleConfig from '../../config/google.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { MediaModule } from '../media/media.module';
import { MediaGenerationModule } from '../media-generation/media-generation.module';
import { MediaTemplatesModule } from '../media-templates/media-templates.module';
import { PostsModule } from '../posts/posts.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CouncilAgentService } from './council-agent.service';
import { CouncilController } from './council.controller';
import { CouncilEventService } from './council-event.service';
import { CouncilJobHandler } from './council-job.handler';
import { CouncilJobHandlerRegistrar } from './council-job-handler.registrar';
import { CouncilJobService } from './council-job.service';
import { CouncilOrchestrator } from './council-orchestrator';
import { CouncilMediaPhaseService } from './council-media-phase.service';
import { MediaVisionReviewerService } from './media-vision-reviewer.service';
import { EditorOutputParser } from './parsers/editor-output.parser';
import { MediaCreatorOutputParser } from './parsers/media-creator-output.parser';
import { MediaReviewerOutputParser } from './parsers/media-reviewer-output.parser';
import { ReviewerOutputParser } from './parsers/reviewer-output.parser';
import { WriterOutputParser } from './parsers/writer-output.parser';

@Module({
  imports: [
    ConfigModule.forFeature(councilConfig),
    ConfigModule.forFeature(googleConfig),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => PostsModule),
    forwardRef(() => GenerationModule),
    MediaModule,
    forwardRef(() => MediaGenerationModule),
    MediaTemplatesModule,
    SchedulingModule,
  ],
  controllers: [CouncilController],
  providers: [
    CouncilAgentService,
    CouncilEventService,
    CouncilOrchestrator,
    CouncilJobService,
    CouncilJobHandler,
    CouncilJobHandlerRegistrar,
    WriterOutputParser,
    ReviewerOutputParser,
    EditorOutputParser,
    MediaCreatorOutputParser,
    MediaReviewerOutputParser,
    CouncilMediaPhaseService,
    MediaVisionReviewerService,
  ],
  exports: [
    CouncilJobService,
    CouncilJobHandler,
    CouncilAgentService,
    CouncilEventService,
    CouncilOrchestrator,
    CouncilMediaPhaseService,
  ],
})
export class CouncilModule {}
