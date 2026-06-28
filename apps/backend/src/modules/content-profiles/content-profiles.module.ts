import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { GenerationModule } from '../generation/generation.module';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContentProfileAiService } from './content-profile-ai.service';
import { ContentProfileSuggestOutputParser } from './content-profile-suggest-output.parser';
import { ContentProfilesController } from './content-profiles.controller';
import { ContentProfilesService } from './content-profiles.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    CreditsModule,
    GenerationModule,
    LinkedInModule,
  ],
  controllers: [ContentProfilesController],
  providers: [
    ContentProfilesService,
    ContentProfileAiService,
    ContentProfileSuggestOutputParser,
  ],
})
export class ContentProfilesModule {}
