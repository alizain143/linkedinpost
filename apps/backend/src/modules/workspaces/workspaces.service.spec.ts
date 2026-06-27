import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildUser,
  buildWorkspace,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: prisma },
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

    it('uses default name when firstName is missing', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);
      prisma.workspace.create.mockResolvedValue(buildWorkspace({ name: 'Personal' }));

      await service.ensurePersonalWorkspace(userId);

      expect(prisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Personal' }),
        }),
      );
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

    it('throws WORKSPACE_FORBIDDEN when not a member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.assertMember(userId, workspaceId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getCurrentWorkspace', () => {
    it('throws when personal workspace is missing', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);

      await expect(service.getCurrentWorkspace(userId)).rejects.toThrow(
        NotFoundException,
      );
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
      expect(result[0].id).toBe(workspace.id);
      expect(result[0].name).toBe(workspace.name);
    });
  });
});
