import { Injectable } from '@nestjs/common';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ComparePickRequestDto } from './dto/compare-pick-request.dto';
import { ComparePickGenerator } from './flows/compare-pick.generator';
import { ComparePickResult, QuickDraftVariant } from './generation.types';
import { PostType } from '@prisma/client';

@Injectable()
export class ComparePickService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly comparePickGenerator: ComparePickGenerator,
  ) {}

  async pickBest(
    workspaceId: string,
    userId: string,
    dto: ComparePickRequestDto,
  ): Promise<ComparePickResult> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const variants: QuickDraftVariant[] = dto.variants.map((variant) => ({
      hook: variant.hook,
      body: variant.body,
      cta: variant.cta,
      tags: variant.tags ?? [],
      postType: PostType.personal_story,
      tone: '',
      pillar: '',
    }));

    return this.comparePickGenerator.generate({
      workspaceId,
      userId,
      contentProfileId: dto.contentProfileId,
      topic: dto.topic,
      variants,
    });
  }
}
