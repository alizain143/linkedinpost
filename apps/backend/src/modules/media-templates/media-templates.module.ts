import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MediaTemplateAiService } from './media-template-ai.service';
import { MediaTemplateResolveService } from './media-template-resolve.service';
import { MediaTemplatesController } from './media-templates.controller';
import { MediaTemplatesService } from './media-templates.service';
import { TemplateMediaRenderService } from './template-media-render.service';
import { TemplatePngRenderer } from './template-png.renderer';
import { TemplateSlotFillParser } from './template-slot-fill.parser';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    forwardRef(() => GenerationModule),
  ],
  controllers: [MediaTemplatesController],
  providers: [
    MediaTemplatesService,
    MediaTemplateAiService,
    MediaTemplateResolveService,
    TemplatePngRenderer,
    TemplateSlotFillParser,
    TemplateMediaRenderService,
  ],
  exports: [
    MediaTemplatesService,
    MediaTemplateResolveService,
    TemplateMediaRenderService,
  ],
})
export class MediaTemplatesModule {}
