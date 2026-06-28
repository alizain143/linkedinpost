import { Injectable } from '@nestjs/common';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { TopicSuggestionsRequestDto } from './dto/topic-suggestions-request.dto';
import { TopicSuggestionsGenerator } from './flows/topic-suggestions.generator';
import { TopicSuggestionsResult } from './generation.types';

@Injectable()
export class TopicSuggestionsService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly topicSuggestionsGenerator: TopicSuggestionsGenerator,
  ) {}

  async suggestTopics(
    workspaceId: string,
    userId: string,
    dto: TopicSuggestionsRequestDto,
  ): Promise<TopicSuggestionsResult> {
    await this.workspacesService.assertMember(userId, workspaceId);

    return this.topicSuggestionsGenerator.generate({
      workspaceId,
      userId,
      contentProfileId: dto.contentProfileId,
      postType: dto.postType,
      tone: dto.tone,
      pillar: dto.pillar,
      additionalContext: dto.additionalContext,
    });
  }
}
