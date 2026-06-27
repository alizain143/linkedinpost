import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Workspace, WorkspaceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface WorkspaceResponse {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { userId },
      include: { workspace: true },
      orderBy: { workspace: { createdAt: 'asc' } },
    });

    return memberships.map((m) => this.toWorkspaceResponse(m.workspace));
  }

  async findPersonalWorkspace(userId: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({
      where: { ownerId: userId, type: WorkspaceType.personal },
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

  async ensurePersonalWorkspace(
    userId: string,
    firstName?: string | null,
  ): Promise<Workspace> {
    const existing = await this.findPersonalWorkspace(userId);

    if (existing) {
      return existing;
    }

    const name = firstName ? `${firstName}'s Workspace` : 'Personal';

    return this.prisma.workspace.create({
      data: {
        name,
        type: WorkspaceType.personal,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
    });
  }

  async assertMember(userId: string, workspaceId: string): Promise<Workspace> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: { workspace: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        error: 'You do not have access to this workspace',
        code: 'WORKSPACE_FORBIDDEN',
      });
    }

    return membership.workspace;
  }
}
