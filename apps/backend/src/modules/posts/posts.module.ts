import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { MediaModule } from '../media/media.module';
import { MediaGenerationModule } from '../media-generation/media-generation.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PipelineController } from './pipeline.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    CreditsModule,
    MediaModule,
    forwardRef(() => MediaGenerationModule),
  ],
  controllers: [PostsController, PipelineController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
