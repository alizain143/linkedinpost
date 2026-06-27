import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { toContentProfileResponse } from './content-profile.mapper';
import { CreateContentProfileDto } from './dto/create-content-profile.dto';
import { UpdateContentProfileDto } from './dto/update-content-profile.dto';

@Injectable()
export class ContentProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async findProfileInWorkspace(workspaceId: string, id: string) {
    const profile = await this.prisma.contentProfile.findFirst({
      where: { id, workspaceId },
      include: { pillars: true },
    });

    if (!profile) {
      throw new NotFoundException({
        error: 'Content profile not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return profile;
  }

  private buildPillarCreates(pillars?: string[]) {
    if (!pillars) {
      return undefined;
    }

    return pillars.map((name, sortOrder) => ({ name, sortOrder }));
  }

  private async unsetOtherDefaults(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    excludeId?: string,
  ) {
    await tx.contentProfile.updateMany({
      where: {
        workspaceId,
        isDefault: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  async list(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const profiles = await this.prisma.contentProfile.findMany({
      where: { workspaceId },
      include: { pillars: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return profiles.map(toContentProfileResponse);
  }

  async getOne(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const profile = await this.findProfileInWorkspace(workspaceId, id);
    return toContentProfileResponse(profile);
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateContentProfileDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const { pillars, isDefault, ...fields } = dto;
    const pillarCreates = this.buildPillarCreates(pillars);

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await this.unsetOtherDefaults(tx, workspaceId);
      }

      const profile = await tx.contentProfile.create({
        data: {
          workspaceId,
          ...fields,
          isDefault: isDefault ?? false,
          ...(pillarCreates?.length
            ? { pillars: { create: pillarCreates } }
            : {}),
        },
        include: { pillars: true },
      });

      return toContentProfileResponse(profile);
    });
  }

  async update(
    workspaceId: string,
    id: string,
    userId: string,
    dto: UpdateContentProfileDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.findProfileInWorkspace(workspaceId, id);

    const { pillars, isDefault, ...fields } = dto;
    const pillarCreates = this.buildPillarCreates(pillars);

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await this.unsetOtherDefaults(tx, workspaceId, id);
      }

      if (pillars !== undefined) {
        await tx.contentPillar.deleteMany({
          where: { contentProfileId: id },
        });
      }

      const profile = await tx.contentProfile.update({
        where: { id },
        data: {
          ...fields,
          ...(isDefault !== undefined ? { isDefault } : {}),
          ...(pillarCreates !== undefined
            ? { pillars: { create: pillarCreates } }
            : {}),
        },
        include: { pillars: true },
      });

      return toContentProfileResponse(profile);
    });
  }

  async remove(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const profile = await this.findProfileInWorkspace(workspaceId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.contentProfile.delete({ where: { id } });

      if (profile.isDefault) {
        const oldest = await tx.contentProfile.findFirst({
          where: { workspaceId },
          orderBy: { createdAt: 'asc' },
        });

        if (oldest) {
          await tx.contentProfile.update({
            where: { id: oldest.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { deleted: true };
  }
}
