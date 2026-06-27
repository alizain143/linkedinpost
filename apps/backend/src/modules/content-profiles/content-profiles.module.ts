import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContentProfilesController } from './content-profiles.controller';
import { ContentProfilesService } from './content-profiles.service';

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [ContentProfilesController],
  providers: [ContentProfilesService],
})
export class ContentProfilesModule {}
