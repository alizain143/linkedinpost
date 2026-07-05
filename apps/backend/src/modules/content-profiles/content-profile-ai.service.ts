import { Inject, Injectable } from '@nestjs/common';
import { CreditTransactionType } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { CONTENT_PROFILE_AI_CREDIT_COST } from '../../common/constants/content-profile-ai.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { LinkedInProfileService } from '../linkedin/linkedin.services';
import type { LinkedInProfileData } from '../linkedin/linkedin.types';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  ContentProfileSuggestOutputParser,
  SuggestedContentProfile,
} from './content-profile-suggest-output.parser';
import { ContentProfilesService } from './content-profiles.service';
import { ApproveContentProfileSuggestionsDto } from './dto/approve-content-profile-suggestions.dto';
import { CreateContentProfileDto } from './dto/create-content-profile.dto';
import { SuggestContentProfilesDto } from './dto/suggest-content-profiles.dto';
import {
  CONTENT_PROFILE_SUGGEST_V1_SYSTEM,
  CONTENT_PROFILE_SUGGEST_V1_USER,
} from './prompts/content-profile-suggest.v1';

export interface ContentProfileSuggestionsResult {
  profiles: SuggestedContentProfile[];
  promptId: string;
  promptVersion: string;
  model: string;
}

@Injectable()
export class ContentProfileAiService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly linkedInProfileService: LinkedInProfileService,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: ContentProfileSuggestOutputParser,
    private readonly contentProfilesService: ContentProfilesService,
    private readonly creditsService: CreditsService,
    private readonly prisma: PrismaService,
  ) {}

  async suggestProfiles(
    workspaceId: string,
    userId: string,
    dto: SuggestContentProfilesDto,
  ): Promise<ContentProfileSuggestionsResult> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const linkedInProfile =
      await this.linkedInProfileService.getWorkspaceProfile(
        workspaceId,
        userId,
      );
    const messages = this.buildMessages(dto, linkedInProfile);
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const parsed = this.outputParser.parse(completion.content);

    return {
      profiles: parsed.profiles.map((profile, index) => ({
        ...profile,
        isDefault: index === 0,
      })),
      promptId: 'content-profile-suggest',
      promptVersion: 'v1',
      model: completion.model,
    };
  }

  async approveSuggestions(
    workspaceId: string,
    userId: string,
    dto: ApproveContentProfileSuggestionsDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const cost = dto.profiles.length * CONTENT_PROFILE_AI_CREDIT_COST;
    await this.creditsService.assertHasCredits(userId, cost);

    const existingCount = await this.prisma.contentProfile.count({
      where: { workspaceId, ...NOT_DELETED },
    });

    const created = [];

    for (let index = 0; index < dto.profiles.length; index++) {
      const profileDto = this.normalizeApprovedProfile(
        dto.profiles[index],
        existingCount === 0 && index === 0,
      );

      const profile = await this.contentProfilesService.create(
        workspaceId,
        userId,
        profileDto,
      );

      await this.creditsService.consume(
        userId,
        CONTENT_PROFILE_AI_CREDIT_COST,
        CreditTransactionType.content_profile,
        { reason: profile.name },
      );

      created.push(profile);
    }

    return created;
  }

  private normalizeApprovedProfile(
    dto: CreateContentProfileDto,
    shouldBeDefault: boolean,
  ): CreateContentProfileDto {
    return {
      ...dto,
      isDefault: shouldBeDefault ? true : (dto.isDefault ?? false),
    };
  }

  private buildMessages(
    dto: SuggestContentProfilesDto,
    linkedInProfile: LinkedInProfileData | null,
  ) {
    const values = {
      'linkedin.block': this.buildLinkedInBlock(linkedInProfile),
      'questionnaire.roleTitle': dto.roleTitle ?? '',
      'questionnaire.industry': dto.industry ?? '',
      'questionnaire.targetAudience': dto.targetAudience ?? '',
      'questionnaire.contentGoal': dto.contentGoal ?? '',
      'questionnaire.offerDescription': dto.offerDescription ?? '',
      'questionnaire.notes': dto.notes ?? '',
    };

    return [
      { role: 'system' as const, content: CONTENT_PROFILE_SUGGEST_V1_SYSTEM },
      {
        role: 'user' as const,
        content: this.renderTemplate(CONTENT_PROFILE_SUGGEST_V1_USER, values),
      },
    ];
  }

  private buildLinkedInBlock(profile: LinkedInProfileData | null): string {
    if (!profile) {
      return '<linkedin>Not connected</linkedin>';
    }

    const positions = profile.positions
      .map((position) => {
        const title = position.title ?? 'Unknown role';
        const company = position.companyName ?? 'Unknown company';
        return `${title} at ${company}${position.isCurrent ? ' (current)' : ''}`;
      })
      .join('; ');

    const education = profile.education
      .map((entry) => {
        const parts = [
          entry.schoolName,
          entry.degreeName,
          entry.fieldOfStudy,
        ].filter(Boolean);
        return parts.join(' — ');
      })
      .join('; ');

    return `<linkedin>
fullName: ${profile.fullName ?? ''}
currentTitle: ${profile.currentTitle ?? ''}
currentCompany: ${profile.currentCompany ?? ''}
headline: ${profile.headline ?? ''}
profileUrl: ${profile.profileUrl ?? ''}
profilePhoto: ${profile.pictureUrl ? 'available' : 'not available'}
positions: ${positions || 'None'}
education: ${education || 'None'}
</linkedin>`;
  }

  private renderTemplate(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(
      /\{\{([^}]+)\}\}/g,
      (_match, key: string) => values[key.trim()] ?? '',
    );
  }
}
