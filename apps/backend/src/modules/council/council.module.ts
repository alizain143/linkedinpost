import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import councilConfig from '../../config/council.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { MediaModule } from '../media/media.module';
import { PostsModule } from '../posts/posts.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CouncilAgentService } from './council-agent.service';
import { CouncilController } from './council.controller';
import { CouncilEventService } from './council-event.service';
import { CouncilJobHandler } from './council-job.handler';
import { CouncilJobHandlerRegistrar } from './council-job-handler.registrar';
import { CouncilJobService } from './council-job.service';
import { CouncilOrchestrator } from './council-orchestrator';
import { EditorOutputParser } from './parsers/editor-output.parser';
import { MediaCreatorOutputParser } from './parsers/media-creator-output.parser';
import { MediaReviewerOutputParser } from './parsers/media-reviewer-output.parser';
import { ReviewerOutputParser } from './parsers/reviewer-output.parser';
import { WriterOutputParser } from './parsers/writer-output.parser';

@Module({
  imports: [
    ConfigModule.forFeature(councilConfig),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => PostsModule),
    forwardRef(() => GenerationModule),
    MediaModule,
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
  ],
  exports: [
    CouncilJobService,
    CouncilJobHandler,
    CouncilAgentService,
    CouncilEventService,
    CouncilOrchestrator,
  ],
})
export class CouncilModule {}
