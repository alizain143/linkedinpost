import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserPlan } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeatureService } from './plan-feature.service';

describe('PlanFeatureService', () => {
  let service: PlanFeatureService;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanFeatureService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PlanFeatureService);
  });

  it('allows agency users for client workspaces', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      plan: UserPlan.agency,
    });

    await expect(
      service.assertAllows(userId, 'client_workspaces'),
    ).resolves.toBeUndefined();
  });

  it('blocks pro users from client workspaces', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      plan: UserPlan.pro,
    });

    await expect(
      service.assertAllows(userId, 'client_workspaces'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows agency users for approval share links', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      plan: UserPlan.agency,
    });

    await expect(
      service.assertAllows(userId, 'approval_share_links'),
    ).resolves.toBeUndefined();
  });

  it('blocks pro users from approval share links', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      plan: UserPlan.pro,
    });

    await expect(
      service.assertAllows(userId, 'approval_share_links'),
    ).rejects.toThrow(ForbiddenException);
  });
});
