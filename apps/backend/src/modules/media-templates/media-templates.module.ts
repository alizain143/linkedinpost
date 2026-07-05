import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MediaTemplateAiService } from './media-template-ai.service';
import { MediaTemplateResolveService } from './media-template-resolve.service';
import { MediaTemplatesController } from './media-templates.controller';
import { MediaTemplatesService } from './media-templates.service';
import { TemplateMediaRenderService } from './template-media-render.service';
import { TemplatePngRenderer } from './template-png.renderer';
import { TemplateProfileResolverService } from './template-profile-resolver.service';
import { TemplateSlotFillParser } from './template-slot-fill.parser';
import { CarouselSlotFillParser } from './carousel-slot-fill.parser';
import { TemplateCarouselRenderService } from './template-carousel-render.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    LinkedInModule,
    forwardRef(() => GenerationModule),
  ],
  controllers: [MediaTemplatesController],
  providers: [
    MediaTemplatesService,
    MediaTemplateAiService,
    MediaTemplateResolveService,
    TemplatePngRenderer,
    TemplateSlotFillParser,
    CarouselSlotFillParser,
    TemplateMediaRenderService,
    TemplateCarouselRenderService,
    TemplateProfileResolverService,
  ],
  exports: [
    MediaTemplatesService,
    MediaTemplateResolveService,
    TemplateMediaRenderService,
    TemplateCarouselRenderService,
    TemplateProfileResolverService,
  ],
})
export class MediaTemplatesModule {}
