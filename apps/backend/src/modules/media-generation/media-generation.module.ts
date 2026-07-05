import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import councilConfig from '../../config/council.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { CouncilModule } from '../council/council.module';
import { GenerationModule } from '../generation/generation.module';
import { MediaModule } from '../media/media.module';
import { MediaTemplatesModule } from '../media-templates/media-templates.module';
import { PostsModule } from '../posts/posts.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MediaJobHandler } from './media-job.handler';
import { MediaJobHandlerRegistrar } from './media-job-handler.registrar';
import { MediaJobService } from './media-job.service';
import { MediaOnlyOrchestrator } from './media-only-orchestrator';
import { MediaRenderService } from './media-render.service';
import { FreestyleCarouselPlanParser } from './freestyle-carousel-plan.parser';
import { FreestyleCarouselRenderService } from './freestyle-carousel-render.service';

@Module({
  imports: [
    ConfigModule.forFeature(councilConfig),
    PrismaModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => PostsModule),
    MediaModule,
    MediaTemplatesModule,
    forwardRef(() => CouncilModule),
    forwardRef(() => GenerationModule),
  ],
  providers: [
    MediaRenderService,
    FreestyleCarouselPlanParser,
    FreestyleCarouselRenderService,
    MediaOnlyOrchestrator,
    MediaJobService,
    MediaJobHandler,
    MediaJobHandlerRegistrar,
  ],
  exports: [MediaJobService, MediaRenderService, FreestyleCarouselRenderService],
})
export class MediaGenerationModule {}
