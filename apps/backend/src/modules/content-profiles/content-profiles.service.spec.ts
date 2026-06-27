import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildWorkspace,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ContentProfilesService } from './content-profiles.service';

describe('ContentProfilesService', () => {
  let service: ContentProfilesService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };

  const profileId = '55555555-5555-5555-5555-555555555555';

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(buildWorkspace());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentProfilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
      ],
    }).compile();

    service = module.get(ContentProfilesService);
  });

  describe('create', () => {
    it('creates profile with pillars and unsets other defaults', async () => {
      const created = {
        id: profileId,
        workspaceId,
        name: 'Maya',
        roleTitle: null,
        industry: null,
        targetAudience: null,
        contentGoal: 'build_authority',
        preferredTone: null,
        offerDescription: null,
        writingSample: null,
        avoidWords: null,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillars: [{ id: 'p1', name: 'Lessons', sortOrder: 0 }],
      };

      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.contentProfile.updateMany.mockResolvedValue({ count: 1 });
      prisma.contentProfile.create.mockResolvedValue(created);

      const result = await service.create(workspaceId, userId, {
        name: 'Maya',
        isDefault: true,
        pillars: ['Lessons'],
      });

      expect(prisma.contentProfile.updateMany).toHaveBeenCalled();
      expect(result.name).toBe('Maya');
      expect(result.pillars).toHaveLength(1);
    });
  });

  describe('getOne', () => {
    it('throws when profile not in workspace', async () => {
      prisma.contentProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.getOne(workspaceId, profileId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('promotes oldest profile when default is deleted', async () => {
      const profile = {
        id: profileId,
        workspaceId,
        name: 'Default',
        roleTitle: null,
        industry: null,
        targetAudience: null,
        contentGoal: 'build_authority' as const,
        preferredTone: null,
        offerDescription: null,
        writingSample: null,
        avoidWords: null,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillars: [],
      };
      const oldest = { ...profile, id: '66666666-6666-6666-6666-666666666666' };

      prisma.contentProfile.findFirst
        .mockResolvedValueOnce(profile)
        .mockResolvedValueOnce(oldest);
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.contentProfile.delete.mockResolvedValue(profile);
      prisma.contentProfile.update.mockResolvedValue({
        ...oldest,
        isDefault: true,
      });

      const result = await service.remove(workspaceId, profileId, userId);

      expect(result).toEqual({ deleted: true });
      expect(prisma.contentProfile.update).toHaveBeenCalledWith({
        where: { id: oldest.id },
        data: { isDefault: true },
      });
    });
  });
});
