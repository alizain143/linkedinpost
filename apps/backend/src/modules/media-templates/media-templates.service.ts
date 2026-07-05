import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaMode, Prisma } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateMediaTemplateDto } from './dto/create-media-template.dto';
import { PreviewMediaTemplateDto } from './dto/preview-media-template.dto';
import { SetDefaultMediaTemplateDto } from './dto/set-default-media-template.dto';
import { UpdateMediaTemplateDto } from './dto/update-media-template.dto';
import { parseMediaTemplateLayout } from './layout.validator';
import {
  SYSTEM_IDENTITY_CARD_PRESET_ID,
  TemplateBindContext,
} from './layout.types';
import {
  MediaTemplateResponse,
  toMediaTemplateResponse,
} from './media-template.mapper';
import { MediaTemplateResolveService } from './media-template-resolve.service';
import {
  getSystemIdentityCardPreset,
  IDENTITY_CARD_LAYOUT,
} from './presets/identity-card.preset';
import { TemplatePngRenderer } from './template-png.renderer';
import { TemplateProfileResolverService } from './template-profile-resolver.service';

@Injectable()
export class MediaTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly resolveService: MediaTemplateResolveService,
    private readonly pngRenderer: TemplatePngRenderer,
    private readonly templateProfileResolver: TemplateProfileResolverService,
  ) {}

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const workspace = await this.prisma.workspace.findFirstOrThrow({
      where: { id: workspaceId, ...NOT_DELETED },
      select: { defaultMediaTemplateId: true, defaultMediaMode: true },
    });

    const rows = await this.prisma.mediaTemplate.findMany({
      where: { workspaceId, ...NOT_DELETED },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      templates: rows.map((row) =>
        toMediaTemplateResponse(row, {
          isWorkspaceDefault: row.id === workspace.defaultMediaTemplateId,
        }),
      ),
      presets: this.resolveService.listSystemPresets(),
      defaultMediaMode: workspace.defaultMediaMode,
      defaultMediaTemplateId: workspace.defaultMediaTemplateId,
    };
  }

  async getOne(workspaceId: string, userId: string, id: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    if (id === SYSTEM_IDENTITY_CARD_PRESET_ID) {
      const preset = getSystemIdentityCardPreset();
      return {
        id: preset.id,
        workspaceId,
        name: preset.name,
        description: preset.description,
        width: preset.width,
        height: preset.height,
        layout: preset.layout,
        isSystem: true,
        isWorkspaceDefault: false,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      } satisfies MediaTemplateResponse;
    }

    const workspace = await this.prisma.workspace.findFirstOrThrow({
      where: { id: workspaceId, ...NOT_DELETED },
      select: { defaultMediaTemplateId: true },
    });

    const row = await this.findInWorkspace(workspaceId, id);
    return toMediaTemplateResponse(row, {
      isWorkspaceDefault: row.id === workspace.defaultMediaTemplateId,
    });
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateMediaTemplateDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const width = dto.width ?? 1080;
    const height = dto.height ?? 1080;
    const layout = parseMediaTemplateLayout(dto.layout, { width, height });

    const row = await this.prisma.mediaTemplate.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        width,
        height,
        layout: layout as unknown as Prisma.InputJsonValue,
      },
    });

    return toMediaTemplateResponse(row);
  }

  async createFromPreset(workspaceId: string, userId: string, presetId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    if (presetId !== SYSTEM_IDENTITY_CARD_PRESET_ID) {
      throw new NotFoundException({
        error: 'Preset not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const preset = getSystemIdentityCardPreset();
    const row = await this.prisma.mediaTemplate.create({
      data: {
        workspaceId,
        name: preset.name,
        description: preset.description,
        width: preset.width,
        height: preset.height,
        layout: IDENTITY_CARD_LAYOUT as unknown as Prisma.InputJsonValue,
        isSystem: false,
      },
    });

    return toMediaTemplateResponse(row);
  }

  async update(
    workspaceId: string,
    userId: string,
    id: string,
    dto: UpdateMediaTemplateDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findInWorkspace(workspaceId, id);

    const data: Prisma.MediaTemplateUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.layout !== undefined) {
      const canvasWidth = dto.width ?? existing.width;
      const canvasHeight = dto.height ?? existing.height;
      data.layout = parseMediaTemplateLayout(dto.layout, {
        width: canvasWidth,
        height: canvasHeight,
      }) as unknown as Prisma.InputJsonValue;
    }

    const row = await this.prisma.mediaTemplate.update({
      where: { id },
      data,
    });

    return toMediaTemplateResponse(row);
  }

  async remove(workspaceId: string, userId: string, id: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.findInWorkspace(workspaceId, id);

    await this.prisma.$transaction([
      this.prisma.workspace.updateMany({
        where: { id: workspaceId, defaultMediaTemplateId: id },
        data: { defaultMediaTemplateId: null },
      }),
      this.prisma.contentProfile.updateMany({
        where: { workspaceId, defaultMediaTemplateId: id },
        data: { defaultMediaTemplateId: null },
      }),
      this.prisma.mediaTemplate.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { id, deleted: true };
  }

  async setDefault(
    workspaceId: string,
    userId: string,
    dto: SetDefaultMediaTemplateDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    if (dto.templateId) {
      await this.findInWorkspace(workspaceId, dto.templateId);
    }

    if (dto.scope === 'workspace') {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { defaultMediaTemplateId: dto.templateId ?? null },
      });
      return { scope: dto.scope, templateId: dto.templateId ?? null };
    }

    if (!dto.contentProfileId) {
      throw new BadRequestException({
        error: 'contentProfileId is required for content_profile scope',
        code: 'VALIDATION_ERROR',
      });
    }

    const profile = await this.prisma.contentProfile.findFirst({
      where: {
        id: dto.contentProfileId,
        workspaceId,
        ...NOT_DELETED,
      },
    });

    if (!profile) {
      throw new NotFoundException({
        error: 'Content profile not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    await this.prisma.contentProfile.update({
      where: { id: profile.id },
      data: { defaultMediaTemplateId: dto.templateId ?? null },
    });

    return {
      scope: dto.scope,
      contentProfileId: dto.contentProfileId,
      templateId: dto.templateId ?? null,
    };
  }

  async setDefaultMediaMode(
    workspaceId: string,
    userId: string,
    mode: MediaMode,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { defaultMediaMode: mode },
    });
    return { defaultMediaMode: mode };
  }

  async previewPng(
    workspaceId: string,
    userId: string,
    id: string | null,
    dto: PreviewMediaTemplateDto,
  ): Promise<{ pngBase64: string; mimeType: string }> {
    await this.workspacesService.assertMember(userId, workspaceId);

    let width = 1080;
    let height = 1080;
    let layout = IDENTITY_CARD_LAYOUT;

    if (id && id !== SYSTEM_IDENTITY_CARD_PRESET_ID) {
      const row = await this.findInWorkspace(workspaceId, id);
      width = row.width;
      height = row.height;
      layout = parseMediaTemplateLayout(row.layout);
    } else if (id === SYSTEM_IDENTITY_CARD_PRESET_ID) {
      const preset = getSystemIdentityCardPreset();
      width = preset.width;
      height = preset.height;
      layout = preset.layout;
    }

    if (dto.layout) {
      layout = parseMediaTemplateLayout(dto.layout, { width, height });
    }

    const resolved = await this.templateProfileResolver.resolveForWorkspace(
      workspaceId,
      userId,
      {
        profileName: dto.profileName,
        roleTitle: dto.roleTitle,
      },
    );

    const ctx: TemplateBindContext = {
      profileName: resolved.profileName,
      roleTitle: resolved.roleTitle,
      currentCompany: resolved.currentCompany,
      industry: resolved.industry,
      avatarUrl: resolved.avatarUrl,
      brandPrimary: resolved.brandPrimary,
      brandAccent: resolved.brandAccent,
      slots: {
        headline:
          dto.headline?.trim() ||
          'Your headline goes here with emphasis.',
        headlineHighlight: dto.headlineHighlight?.trim() || 'emphasis.',
        subhead:
          dto.subhead?.trim() ||
          'Supporting line that explains the idea in one sentence.',
        altText: 'Template preview',
      },
    };

    const png = await this.pngRenderer.renderPng(layout, width, height, ctx);
    return {
      pngBase64: png.toString('base64'),
      mimeType: 'image/png',
    };
  }

  private async findInWorkspace(workspaceId: string, id: string) {
    const row = await this.prisma.mediaTemplate.findFirst({
      where: { id, workspaceId, ...NOT_DELETED },
    });
    if (!row) {
      throw new NotFoundException({
        error: 'Media template not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return row;
  }
}
