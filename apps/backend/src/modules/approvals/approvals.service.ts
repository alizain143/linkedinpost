import { Injectable } from '@nestjs/common';
import { WorkspaceType } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  ApprovalTab,
  APPROVAL_TABS,
  getCountWheres,
  getTabWhere,
} from './approvals.constants';
import { toApprovalQueueItem } from './approvals.mapper';
import { ApprovalsQueryDto } from './dto/approvals-query.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getApprovals(
    workspaceId: string,
    userId: string,
    query: ApprovalsQueryDto,
  ) {
    const workspace = await this.workspacesService.assertMember(
      userId,
      workspaceId,
    );

    const tab = query.tab ?? ApprovalTab.mine;
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const clientWorkspaceIds = await this.getClientWorkspaceIds(
      userId,
      workspace.id,
    );

    const counts = await this.getTabCounts(workspaceId, clientWorkspaceIds);
    const where = getTabWhere(tab, workspaceId, clientWorkspaceIds);

    const posts = await this.prisma.postPackage.findMany({
      where,
      include: { workspace: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      tab,
      counts,
      items: posts.map(toApprovalQueueItem),
    };
  }

  private async getClientWorkspaceIds(
    userId: string,
    currentWorkspaceId: string,
  ): Promise<string[]> {
    const clientWorkspaces = await this.prisma.workspace.findMany({
      where: {
        ownerId: userId,
        type: WorkspaceType.client,
        ...NOT_DELETED,
      },
      select: { id: true },
    });

    return clientWorkspaces
      .map((workspace) => workspace.id)
      .filter((id) => id !== currentWorkspaceId);
  }

  private async getTabCounts(
    workspaceId: string,
    clientWorkspaceIds: string[],
  ): Promise<Record<ApprovalTab, number>> {
    const wheres = getCountWheres(workspaceId, clientWorkspaceIds);

    const entries = await Promise.all(
      APPROVAL_TABS.map(async (tab) => {
        const count = await this.prisma.postPackage.count({ where: wheres[tab] });
        return [tab, count] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<ApprovalTab, number>;
  }
}
