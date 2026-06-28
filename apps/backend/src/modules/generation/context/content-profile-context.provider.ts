import { Injectable } from '@nestjs/common';
import { NOT_DELETED } from '../../../common/constants/soft-delete.constants';
import { PrismaService } from '../../../prisma/prisma.service';
import { generationContextError } from '../generation.errors';
import { ContextProvider } from './context-provider.interface';
import {
  GenerationContext,
  GenerationContextSlice,
  QuickDraftInput,
} from '../generation.types';

@Injectable()
export class ContentProfileContextProvider implements ContextProvider {
  readonly order = 20;

  constructor(private readonly prisma: PrismaService) {}

  async provide(
    input: QuickDraftInput,
    _accumulated: GenerationContext,
  ): Promise<GenerationContextSlice> {
    const profile = input.contentProfileId
      ? await this.prisma.contentProfile.findFirst({
          where: {
            id: input.contentProfileId,
            workspaceId: input.workspaceId,
            ...NOT_DELETED,
          },
          include: { pillars: true },
        })
      : await this.resolveDefaultProfile(input.workspaceId);

    if (!profile) {
      throw generationContextError(
        input.contentProfileId
          ? 'Content profile not found in workspace'
          : 'No content profile available for generation',
      );
    }

    return {
      contentProfileId: profile.id,
      contentProfile: {
        id: profile.id,
        name: profile.name,
        roleTitle: profile.roleTitle,
        industry: profile.industry,
        targetAudience: profile.targetAudience,
        contentGoal: profile.contentGoal,
        preferredTone: profile.preferredTone,
        brandPrimary: profile.brandPrimary,
        brandAccent: profile.brandAccent,
        offerDescription: profile.offerDescription,
        writingSample: profile.writingSample,
        avoidWords: profile.avoidWords,
        pillars: profile.pillars
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((pillar) => pillar.name),
      },
    };
  }

  private async resolveDefaultProfile(workspaceId: string) {
    const defaultProfile = await this.prisma.contentProfile.findFirst({
      where: { workspaceId, isDefault: true, ...NOT_DELETED },
      include: { pillars: true },
    });

    if (defaultProfile) {
      return defaultProfile;
    }

    return this.prisma.contentProfile.findFirst({
      where: { workspaceId, ...NOT_DELETED },
      include: { pillars: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
