import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus } from '@prisma/client';
import {
  buildPost,
  buildWorkspace,
  postId,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { mockNotificationEventServiceProvider } from '../../test/notification-event.mock';
import { MediaService } from '../media/media.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  generateApprovalRawToken,
  hashApprovalToken,
} from './approval-token.util';
import { ApprovalShareService } from './approval-share.service';

describe('ApprovalShareService', () => {
  let service: ApprovalShareService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn(), assertOwner: jest.fn() };
  const planFeatureService = { assertAllows: jest.fn() };
  const mediaService = { listForPost: jest.fn().mockResolvedValue([]) };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      if (key === 'app.approvalLinkExpiryDays') return 14;
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(undefined);
    workspacesService.assertOwner.mockResolvedValue(undefined);
    planFeatureService.assertAllows.mockResolvedValue(undefined);
    mediaService.listForPost.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalShareService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: PlanFeatureService, useValue: planFeatureService },
        { provide: MediaService, useValue: mediaService },
        mockNotificationEventServiceProvider(),
      ],
    }).compile();

    service = module.get(ApprovalShareService);
  });

  describe('createLink', () => {
    it('creates a share link and revokes prior active tokens', async () => {
      const post = buildPost({ status: PostPackageStatus.ready_for_approval });
      prisma.postPackage.findFirst.mockResolvedValue(post);
      prisma.approvalToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalToken.create.mockResolvedValue({});

      const result = await service.createLink(workspaceId, postId, userId);

      expect(planFeatureService.assertAllows).toHaveBeenCalledWith(
        userId,
        'approval_share_links',
      );
      expect(prisma.approvalToken.updateMany).toHaveBeenCalled();
      expect(prisma.approvalToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            postPackageId: postId,
            createdById: userId,
          }),
        }),
      );
      expect(result.url).toMatch(/^http:\/\/localhost:3000\/approve\//);
      expect(result.expiresAt).toBeDefined();
    });

    it('rejects non-agency users', async () => {
      planFeatureService.assertAllows.mockRejectedValue(
        new ForbiddenException({
          error: 'This feature requires a plan upgrade',
          code: 'PLAN_UPGRADE_REQUIRED',
        }),
      );

      await expect(
        service.createLink(workspaceId, postId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects posts not awaiting approval', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(buildPost());

      await expect(
        service.createLink(workspaceId, postId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveToken', () => {
    it('returns context for a valid token', async () => {
      const rawToken = generateApprovalRawToken();
      const tokenHash = hashApprovalToken(rawToken);
      const post = buildPost({ status: PostPackageStatus.ready_for_approval });
      const workspace = buildWorkspace();

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        usedAt: null,
        createdById: userId,
        createdAt: new Date(),
      });
      prisma.postPackage.findFirst.mockResolvedValue(post);
      prisma.workspace.findFirst.mockResolvedValue(workspace);

      const result = await service.resolveToken(rawToken);

      expect(result.post.id).toBe(postId);
      expect(result.workspace.id).toBe(workspaceId);
    });

    it('rejects expired tokens', async () => {
      const rawToken = generateApprovalRawToken();
      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash: hashApprovalToken(rawToken),
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        usedAt: null,
        createdById: userId,
        createdAt: new Date(),
      });

      await expect(service.resolveToken(rawToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects used tokens', async () => {
      const rawToken = generateApprovalRawToken();
      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash: hashApprovalToken(rawToken),
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        usedAt: new Date(),
        createdById: userId,
        createdAt: new Date(),
      });

      await expect(service.resolveToken(rawToken)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPreview', () => {
    it('returns public preview with media', async () => {
      const rawToken = generateApprovalRawToken();
      const post = buildPost({ status: PostPackageStatus.ready_for_approval });
      const workspace = buildWorkspace({ name: 'Acme Corp' });

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash: hashApprovalToken(rawToken),
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        usedAt: null,
        createdById: userId,
        createdAt: new Date(),
      });
      prisma.postPackage.findFirst.mockResolvedValue(post);
      prisma.workspace.findFirst.mockResolvedValue(workspace);
      mediaService.listForPost.mockResolvedValue([
        {
          url: 'https://cdn.example.com/image.png',
          altText: 'Chart',
          mimeType: 'image/png',
        },
      ]);

      const result = await service.getPreview(rawToken);

      expect(result.workspaceName).toBe('Acme Corp');
      expect(result.hook).toBe(post.hook);
      expect(result.media).toHaveLength(1);
    });
  });

  describe('approve', () => {
    it('approves post and marks token used', async () => {
      const rawToken = generateApprovalRawToken();
      const post = buildPost({ status: PostPackageStatus.ready_for_approval });

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash: hashApprovalToken(rawToken),
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        usedAt: null,
        createdById: userId,
        createdAt: new Date(),
      });
      prisma.postPackage.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({
          ...post,
          status: PostPackageStatus.approved,
        });
      prisma.workspace.findFirst.mockResolvedValue(buildWorkspace());
      prisma.postPackage.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.postPackage.findFirstOrThrow.mockResolvedValue({
        ...post,
        status: PostPackageStatus.approved,
      });

      const result = await service.approve(rawToken);

      expect(result.status).toBe(PostPackageStatus.approved);
      expect(prisma.approvalToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'token-id' }),
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
    });

    it('rejects when post is no longer awaiting approval', async () => {
      const rawToken = generateApprovalRawToken();
      const post = buildPost({ status: PostPackageStatus.approved });

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'token-id',
        postPackageId: postId,
        tokenHash: hashApprovalToken(rawToken),
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        usedAt: null,
        createdById: userId,
        createdAt: new Date(),
      });
      prisma.postPackage.findFirst.mockResolvedValue(post);
      prisma.workspace.findFirst.mockResolvedValue(buildWorkspace());

      await expect(service.approve(rawToken)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLinkStatus', () => {
    it('returns active metadata when token exists', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.ready_for_approval }),
      );
      const expiresAt = new Date(Date.now() + 86_400_000);
      const createdAt = new Date('2026-06-27T00:00:00.000Z');
      prisma.approvalToken.findFirst.mockResolvedValue({
        expiresAt,
        createdAt,
        revokedAt: null,
        usedAt: null,
      });

      const result = await service.getLinkStatus(workspaceId, postId, userId);

      expect(result).toEqual({
        active: true,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
      });
    });

    it('returns inactive when no valid token', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.ready_for_approval }),
      );
      prisma.approvalToken.findFirst.mockResolvedValue(null);

      const result = await service.getLinkStatus(workspaceId, postId, userId);

      expect(result).toEqual({ active: false });
    });
  });
});
