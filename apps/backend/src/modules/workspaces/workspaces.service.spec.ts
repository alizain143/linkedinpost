import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserPlan, WorkspaceType } from '@prisma/client';
import { AGENCY_MAX_CLIENT_WORKSPACES } from '../../common/constants/plan.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildWorkspace,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  const prisma = createMockPrismaService();
  const planFeatureService = { assertAllows: jest.fn() };

  const clientWorkspace = buildWorkspace({
    type: WorkspaceType.client,
    name: 'Acme Corp',
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    planFeatureService.assertAllows.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: prisma },
        { provide: PlanFeatureService, useValue: planFeatureService },
      ],
    }).compile();

    service = module.get(WorkspacesService);
  });

  describe('ensurePersonalWorkspace', () => {
    it('returns existing personal workspace', async () => {
      const workspace = buildWorkspace();
      prisma.workspace.findFirst.mockResolvedValue(workspace);

      const result = await service.ensurePersonalWorkspace(userId, 'Maya');

      expect(result).toBe(workspace);
      expect(prisma.workspace.create).not.toHaveBeenCalled();
    });

    it('creates personal workspace when missing', async () => {
      const workspace = buildWorkspace({ name: "Maya's Workspace" });
      prisma.workspace.findFirst.mockResolvedValue(null);
      prisma.workspace.create.mockResolvedValue(workspace);

      const result = await service.ensurePersonalWorkspace(userId, 'Maya');

      expect(result).toEqual(workspace);
      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: "Maya's Workspace",
          type: WorkspaceType.personal,
          ownerId: userId,
          members: { create: { userId, role: 'owner' } },
        },
      });
    });
  });

  describe('assertMember', () => {
    it('returns workspace when user is a member', async () => {
      const workspace = buildWorkspace();
      prisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId,
        userId,
        role: 'owner',
        workspace,
      });

      const result = await service.assertMember(userId, workspaceId);
      expect(result).toBe(workspace);
    });

    it('throws RESOURCE_NOT_FOUND when not a member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.assertMember(userId, workspaceId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws RESOURCE_NOT_FOUND when workspace is soft-deleted', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId,
        userId,
        role: 'owner',
        workspace: buildWorkspace({ deletedAt: new Date() }),
      });

      await expect(service.assertMember(userId, workspaceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createClientWorkspace', () => {
    it('creates client workspace with default profile', async () => {
      prisma.workspace.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementationOnce(async (fn) => {
        prisma.workspace.create.mockResolvedValue(clientWorkspace);
        prisma.contentProfile.create.mockResolvedValue({});
        return (fn as (tx: typeof prisma) => Promise<unknown>)(prisma);
      });
      prisma.postPackage.count.mockResolvedValue(0);
      prisma.contentProfile.findFirst.mockResolvedValue({ id: 'profile-1' });

      const result = await service.createClientWorkspace(userId, {
        name: 'Acme Corp',
      });

      expect(planFeatureService.assertAllows).toHaveBeenCalledWith(
        userId,
        'client_workspaces',
      );
      expect(result.name).toBe('Acme Corp');
      expect(result.type).toBe(WorkspaceType.client);
      expect(result.stats.hasDefaultProfile).toBe(true);
    });

    it('rejects when client workspace limit is reached', async () => {
      prisma.workspace.count.mockResolvedValue(AGENCY_MAX_CLIENT_WORKSPACES);

      await expect(
        service.createClientWorkspace(userId, { name: 'Sixth Client' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDeleteClientWorkspace', () => {
    it('cascade soft-deletes workspace content', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId,
        userId,
        role: 'owner',
        workspace: clientWorkspace,
      });
      prisma.contentProfile.updateMany.mockResolvedValue({ count: 1 });
      prisma.postPackage.updateMany.mockResolvedValue({ count: 2 });
      prisma.generationJob.updateMany.mockResolvedValue({ count: 0 });
      prisma.autopilotConfig.updateMany.mockResolvedValue({ count: 0 });
      prisma.workspace.update.mockResolvedValue({
        ...clientWorkspace,
        deletedAt: new Date(),
      });

      const result = await service.softDeleteClientWorkspace(
        workspaceId,
        userId,
      );

      expect(result).toEqual({ deleted: true });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: workspaceId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('rejects deleting personal workspace', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        workspaceId,
        userId,
        role: 'owner',
        workspace: buildWorkspace({ type: WorkspaceType.personal }),
      });

      await expect(
        service.softDeleteClientWorkspace(workspaceId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findForUser', () => {
    it('maps memberships to workspace responses', async () => {
      const workspace = buildWorkspace();
      prisma.workspaceMember.findMany.mockResolvedValue([
        { workspaceId, userId, role: 'owner', workspace },
      ]);

      const result = await service.findForUser(userId);

      expect(result).toHaveLength(1);
      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspace: { deletedAt: null },
          }),
        }),
      );
    });
  });
});
