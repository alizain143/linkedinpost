import { Module, forwardRef } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module';
import { ImageScoutModule } from '../image-scout/image-scout.module';
import { MediaRenderService } from './media-render.service';
import { MediaTemplateService } from './media-template.service';

@Module({
  imports: [ImageScoutModule, forwardRef(() => GenerationModule)],
  providers: [MediaTemplateService, MediaRenderService],
  exports: [MediaTemplateService, MediaRenderService],
})
export class MediaTemplatesModule {}
