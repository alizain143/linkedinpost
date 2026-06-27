import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PipelineController } from './pipeline.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [PostsController, PipelineController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
