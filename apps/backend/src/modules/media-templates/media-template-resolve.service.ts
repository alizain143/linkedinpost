import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaMode } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ResolvedMediaTemplate,
  SYSTEM_CAROUSEL_IDENTITY_PRESET_ID,
  SYSTEM_IDENTITY_CARD_PRESET_ID,
} from './layout.types';
import { toResolvedFromRow } from './media-template.mapper';
import { getSystemIdentityCardPreset } from './presets/identity-card.preset';
import { getSystemCarouselIdentityPreset } from './presets/carousel-identity.preset';
import { SYSTEM_PRESETS } from './presets/system-presets';

export interface ResolveMediaOptions {
  workspaceId: string;
  contentProfileId?: string | null;
  mediaMode?: MediaMode | null;
  mediaTemplateId?: string | null;
}

@Injectable()
export class MediaTemplateResolveService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMode(options: ResolveMediaOptions): Promise<MediaMode> {
    if (options.mediaMode) {
      return options.mediaMode;
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: options.workspaceId, ...NOT_DELETED },
      select: { defaultMediaMode: true },
    });

    return workspace?.defaultMediaMode ?? MediaMode.freestyle;
  }

  async resolveTemplate(
    options: ResolveMediaOptions,
  ): Promise<ResolvedMediaTemplate> {
    if (options.mediaTemplateId) {
      return this.loadTemplate(options.workspaceId, options.mediaTemplateId);
    }

    if (options.contentProfileId) {
      const profile = await this.prisma.contentProfile.findFirst({
        where: {
          id: options.contentProfileId,
          workspaceId: options.workspaceId,
          ...NOT_DELETED,
        },
        select: { defaultMediaTemplateId: true },
      });

      if (profile?.defaultMediaTemplateId) {
        return this.loadTemplate(
          options.workspaceId,
          profile.defaultMediaTemplateId,
        );
      }
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: options.workspaceId, ...NOT_DELETED },
      select: { defaultMediaTemplateId: true },
    });

    if (workspace?.defaultMediaTemplateId) {
      return this.loadTemplate(
        options.workspaceId,
        workspace.defaultMediaTemplateId,
      );
    }

    return getSystemIdentityCardPreset();
  }

  listSystemPresets(): ResolvedMediaTemplate[] {
    return SYSTEM_PRESETS;
  }

  private async loadTemplate(
    workspaceId: string,
    templateId: string,
  ): Promise<ResolvedMediaTemplate> {
    if (templateId === SYSTEM_IDENTITY_CARD_PRESET_ID) {
      return getSystemIdentityCardPreset();
    }

    if (templateId === SYSTEM_CAROUSEL_IDENTITY_PRESET_ID) {
      return getSystemCarouselIdentityPreset();
    }

    const row = await this.prisma.mediaTemplate.findFirst({
      where: { id: templateId, workspaceId, ...NOT_DELETED },
    });

    if (!row) {
      throw new NotFoundException({
        error: 'Media template not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return toResolvedFromRow(row);
  }
}
