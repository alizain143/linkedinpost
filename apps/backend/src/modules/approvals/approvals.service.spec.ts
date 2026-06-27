import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus, WorkspaceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPost,
  buildWorkspace,
  postId,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ApprovalTab } from './approvals.constants';
import { ApprovalsService } from './approvals.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(buildWorkspace());
    prisma.workspace.findMany.mockResolvedValue([]);
    prisma.postPackage.count.mockResolvedValue(0);
    prisma.postPackage.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
      ],
    }).compile();

    service = module.get(ApprovalsService);
  });

  describe('getApprovals', () => {
    it('returns queue items with tab counts', async () => {
      prisma.postPackage.count.mockResolvedValue(1);
      prisma.postPackage.findMany.mockResolvedValue([
        {
          ...buildPost({
            id: postId,
            status: PostPackageStatus.ready_for_approval,
            submittedForApprovalAt: new Date('2026-06-27T10:00:00.000Z'),
          }),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        },
      ]);

      const result = await service.getApprovals(workspaceId, userId, {
        tab: ApprovalTab.mine,
      });

      expect(workspacesService.assertMember).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(result.tab).toBe(ApprovalTab.mine);
      expect(result.counts).toMatchObject({
        mine: 1,
        client: 1,
        changes: 1,
        approved: 1,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: postId,
        workspaceName: 'Test Workspace',
      });
    });

    it('queries client tab across owned client workspaces', async () => {
      const clientWorkspaceId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      prisma.workspace.findMany.mockResolvedValue([{ id: clientWorkspaceId }]);

      await service.getApprovals(workspaceId, userId, {
        tab: ApprovalTab.client,
      });

      expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: { in: [clientWorkspaceId] },
            status: PostPackageStatus.ready_for_approval,
          }),
        }),
      );
    });

    it('filters changes tab to drafts with feedback', async () => {
      await service.getApprovals(workspaceId, userId, {
        tab: ApprovalTab.changes,
      });

      expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PostPackageStatus.draft,
            approvalFeedback: { not: null },
          }),
        }),
      );
    });

    it('excludes client workspaces owned by user from unrelated queries', async () => {
      prisma.workspace.findMany.mockResolvedValue([
        { id: workspaceId },
        { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
      ]);

      await service.getApprovals(workspaceId, userId, {
        tab: ApprovalTab.client,
      });

      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: userId,
          type: WorkspaceType.client,
          deletedAt: null,
        },
        select: { id: true },
      });
      expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: { in: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'] },
          }),
        }),
      );
    });
  });
});
