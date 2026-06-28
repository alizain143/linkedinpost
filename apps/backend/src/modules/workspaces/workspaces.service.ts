import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PostPackageStatus,
  Workspace,
  WorkspaceType,
  Prisma,
} from '@prisma/client';
import { AGENCY_MAX_CLIENT_WORKSPACES } from '../../common/constants/plan.constants';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { CreateClientWorkspaceDto } from './dto/create-client-workspace.dto';
import { UpdateClientWorkspaceDto } from './dto/update-client-workspace.dto';

export interface WorkspaceResponse {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceStats {
  draftCount: number;
  scheduledCount: number;
  hasDefaultProfile: boolean;
}

export interface WorkspaceDetailResponse extends WorkspaceResponse {
  stats: WorkspaceStats;
}

const DRAFT_STATUSES: PostPackageStatus[] = [
  PostPackageStatus.draft,
  PostPackageStatus.ready_for_approval,
  PostPackageStatus.approved,
];

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planFeatureService: PlanFeatureService,
  ) {}

  toWorkspaceResponse(workspace: Workspace): WorkspaceResponse {
    return {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async findForUser(userId: string): Promise<WorkspaceResponse[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: NOT_DELETED,
      },
      include: { workspace: true },
      orderBy: { workspace: { createdAt: 'asc' } },
    });

    return memberships.map((m) => this.toWorkspaceResponse(m.workspace));
  }

  async findPersonalWorkspace(userId: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({
      where: {
        ownerId: userId,
        type: WorkspaceType.personal,
        ...NOT_DELETED,
      },
    });
  }

  async getCurrentWorkspace(userId: string): Promise<WorkspaceResponse> {
    const workspace = await this.findPersonalWorkspace(userId);

    if (!workspace) {
      throw new NotFoundException({
        error: 'Workspace not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return this.toWorkspaceResponse(workspace);
  }

  async getById(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceDetailResponse> {
    const workspace = await this.assertMember(userId, workspaceId);
    const stats = await this.getWorkspaceStats(workspaceId);

    return {
      ...this.toWorkspaceResponse(workspace),
      stats,
    };
  }

  async createClientWorkspace(
    userId: string,
    dto: CreateClientWorkspaceDto,
  ): Promise<WorkspaceDetailResponse> {
    await this.planFeatureService.assertAllows(userId, 'client_workspaces');

    const activeCount = await this.prisma.workspace.count({
      where: {
        ownerId: userId,
        type: WorkspaceType.client,
        ...NOT_DELETED,
      },
    });

    if (activeCount >= AGENCY_MAX_CLIENT_WORKSPACES) {
      throw new ConflictException({
        error: `You can have at most ${AGENCY_MAX_CLIENT_WORKSPACES} client workspaces`,
        code: 'CLIENT_WORKSPACE_LIMIT',
      });
    }

    const profileName = dto.name;
    const profileData = dto.profile;

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: dto.name,
          type: WorkspaceType.client,
          ownerId: userId,
          members: {
            create: { userId, role: 'owner' },
          },
        },
      });

      await tx.contentProfile.create({
        data: {
          workspaceId: created.id,
          name: profileName,
          isDefault: true,
          ...(profileData?.industry !== undefined
            ? { industry: profileData.industry }
            : {}),
          ...(profileData?.targetAudience !== undefined
            ? { targetAudience: profileData.targetAudience }
            : {}),
          ...(profileData?.roleTitle !== undefined
            ? { roleTitle: profileData.roleTitle }
            : {}),
          ...(profileData?.pillars?.length
            ? {
                pillars: {
                  create: profileData.pillars.map((name, sortOrder) => ({
                    name,
                    sortOrder,
                  })),
                },
              }
            : {}),
        },
      });

      return created;
    });

    const stats = await this.getWorkspaceStats(workspace.id);

    return {
      ...this.toWorkspaceResponse(workspace),
      stats,
    };
  }

  async updateClientWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateClientWorkspaceDto,
  ): Promise<WorkspaceDetailResponse> {
    const workspace = await this.assertOwner(userId, workspaceId);
    this.assertClientWorkspaceMutable(workspace);

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: dto.name },
    });

    const stats = await this.getWorkspaceStats(workspaceId);

    return {
      ...this.toWorkspaceResponse(updated),
      stats,
    };
  }

  async softDeleteClientWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<{ deleted: true }> {
    const workspace = await this.assertOwner(userId, workspaceId);
    this.assertClientWorkspaceMutable(workspace);

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.contentProfile.updateMany({
        where: { workspaceId, ...NOT_DELETED },
        data: { deletedAt: now },
      }),
      this.prisma.postPackage.updateMany({
        where: { workspaceId, ...NOT_DELETED },
        data: { deletedAt: now },
      }),
      this.prisma.generationJob.updateMany({
        where: { workspaceId, ...NOT_DELETED },
        data: { deletedAt: now },
      }),
      this.prisma.autopilotConfig.updateMany({
        where: { workspaceId, ...NOT_DELETED },
        data: { deletedAt: now },
      }),
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: now },
      }),
    ]);

    return { deleted: true };
  }

  async ensurePersonalWorkspace(
    userId: string,
    firstName?: string | null,
  ): Promise<Workspace> {
    const existing = await this.findPersonalWorkspace(userId);

    if (existing) {
      return existing;
    }

    const name = firstName ? `${firstName}'s Workspace` : 'Personal';

    try {
      return await this.prisma.workspace.create({
        data: {
          name,
          type: WorkspaceType.personal,
          ownerId: userId,
          members: {
            create: { userId, role: 'owner' },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingAfterRace = await this.findPersonalWorkspace(userId);
        if (existingAfterRace) {
          return existingAfterRace;
        }
      }

      throw error;
    }
  }

  async assertMember(userId: string, workspaceId: string): Promise<Workspace> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: { workspace: true },
    });

    if (!membership || membership.workspace.deletedAt) {
      throw new NotFoundException({
        error: 'Workspace not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return membership.workspace;
  }

  async assertOwner(userId: string, workspaceId: string): Promise<Workspace> {
    const workspace = await this.assertMember(userId, workspaceId);

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException({
        error: 'You do not have access to this workspace',
        code: 'WORKSPACE_FORBIDDEN',
      });
    }

    return workspace;
  }

  private assertClientWorkspaceMutable(workspace: Workspace): void {
    if (workspace.type === WorkspaceType.personal) {
      throw new BadRequestException({
        error: 'Personal workspaces cannot be modified with this endpoint',
        code: 'VALIDATION_ERROR',
      });
    }
  }

  private async getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    const [draftCount, scheduledCount, defaultProfile] = await Promise.all([
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: { in: DRAFT_STATUSES },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: PostPackageStatus.scheduled,
        },
      }),
      this.prisma.contentProfile.findFirst({
        where: {
          workspaceId,
          isDefault: true,
          ...NOT_DELETED,
        },
        select: { id: true },
      }),
    ]);

    return {
      draftCount,
      scheduledCount,
      hasDefaultProfile: defaultProfile !== null,
    };
  }
}
