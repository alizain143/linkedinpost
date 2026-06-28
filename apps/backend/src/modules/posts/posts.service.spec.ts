import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPost,
  postId,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { MediaService } from '../media/media.service';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  const prisma = createMockPrismaService();
  const workspacesService = {
    assertMember: jest.fn(),
  };
  const mediaService = {
    listForPost: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(buildPost());
    mediaService.listForPost.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get(PostsService);
  });

  describe('update', () => {
    it('rejects update when post is not draft', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.approved }),
      );

      await expect(
        service.update(workspaceId, postId, userId, { hook: 'New' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('rejects delete when post is not draft', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.scheduled }),
      );

      await expect(
        service.remove(workspaceId, postId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('soft-deletes draft post', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(buildPost());
      prisma.postPackage.update.mockResolvedValue(buildPost());

      const result = await service.remove(workspaceId, postId, userId);

      expect(result).toEqual({ deleted: true });
      expect(prisma.postPackage.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('transitionStatus', () => {
    it('transitions draft to ready_for_approval', async () => {
      const draft = buildPost();
      const updated = {
        ...draft,
        status: PostPackageStatus.ready_for_approval,
        submittedForApprovalAt: new Date('2026-06-27T12:00:00.000Z'),
        approvalFeedback: null,
        _count: { versions: 1 },
      };
      prisma.postPackage.findFirst.mockResolvedValue(draft);
      prisma.postPackage.update.mockResolvedValue(updated);

      const result = await service.transitionStatus(
        workspaceId,
        postId,
        userId,
        { status: PostPackageStatus.ready_for_approval },
      );

      expect(result.status).toBe(PostPackageStatus.ready_for_approval);
      expect(prisma.postPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submittedForApprovalAt: expect.any(Date),
            approvalFeedback: null,
          }),
        }),
      );
    });

    it('requires scheduledAt when scheduling', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.approved }),
      );

      await expect(
        service.transitionStatus(workspaceId, postId, userId, {
          status: PostPackageStatus.scheduled,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects past scheduledAt', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(
        buildPost({ status: PostPackageStatus.approved }),
      );

      await expect(
        service.transitionStatus(workspaceId, postId, userId, {
          status: PostPackageStatus.scheduled,
          scheduledAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets publishedAt when publishing completes', async () => {
      const publishing = buildPost({ status: PostPackageStatus.publishing });
      prisma.postPackage.findFirst.mockResolvedValue(publishing);
      prisma.postPackage.update.mockImplementation(async ({ data }) => ({
        ...publishing,
        ...data,
        _count: { versions: 1 },
      }));

      const result = await service.transitionStatus(
        workspaceId,
        postId,
        userId,
        { status: PostPackageStatus.published },
      );

      expect(result.status).toBe(PostPackageStatus.published);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('clears scheduledAt when cancelling schedule', async () => {
      const scheduled = buildPost({
        status: PostPackageStatus.scheduled,
        scheduledAt: new Date('2026-08-01T12:00:00.000Z'),
      });
      prisma.postPackage.findFirst.mockResolvedValue(scheduled);
      prisma.postPackage.update.mockImplementation(async ({ data }) => ({
        ...scheduled,
        ...data,
        scheduledAt: null,
        status: PostPackageStatus.draft,
        _count: { versions: 1 },
      }));

      const result = await service.transitionStatus(
        workspaceId,
        postId,
        userId,
        { status: PostPackageStatus.draft },
      );

      expect(prisma.postPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ scheduledAt: null }),
        }),
      );
      expect(result.status).toBe(PostPackageStatus.draft);
    });

    it('rejects invalid transition', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(buildPost());

      await expect(
        service.transitionStatus(workspaceId, postId, userId, {
          status: PostPackageStatus.published,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approvePost', () => {
    it('approves a post awaiting review', async () => {
      const pending = buildPost({
        status: PostPackageStatus.ready_for_approval,
        submittedForApprovalAt: new Date('2026-06-27T10:00:00.000Z'),
      });
      prisma.postPackage.findFirst.mockResolvedValue(pending);
      prisma.postPackage.update.mockResolvedValue({
        ...pending,
        status: PostPackageStatus.approved,
        approvalFeedback: null,
        _count: { versions: 1 },
      });

      const result = await service.approvePost(workspaceId, postId, userId);

      expect(result.status).toBe(PostPackageStatus.approved);
      expect(prisma.postPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ approvalFeedback: null }),
        }),
      );
    });
  });

  describe('requestChangesPost', () => {
    it('returns post to draft with feedback', async () => {
      const pending = buildPost({
        status: PostPackageStatus.ready_for_approval,
        submittedForApprovalAt: new Date('2026-06-27T10:00:00.000Z'),
      });
      prisma.postPackage.findFirst.mockResolvedValue(pending);
      prisma.postPackage.update.mockResolvedValue({
        ...pending,
        status: PostPackageStatus.draft,
        approvalFeedback: 'Too casual',
        submittedForApprovalAt: null,
        _count: { versions: 1 },
      });

      const result = await service.requestChangesPost(
        workspaceId,
        postId,
        userId,
        'Too casual',
      );

      expect(result.status).toBe(PostPackageStatus.draft);
      expect(result.approvalFeedback).toBe('Too casual');
    });

    it('rejects invalid transition', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(buildPost());

      await expect(
        service.requestChangesPost(workspaceId, postId, userId, 'Nope'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('applyApprovalAction', () => {
    it('approves without member check', async () => {
      const pending = buildPost({
        status: PostPackageStatus.ready_for_approval,
        submittedForApprovalAt: new Date('2026-06-27T10:00:00.000Z'),
      });
      prisma.postPackage.update.mockResolvedValue({
        ...pending,
        status: PostPackageStatus.approved,
        approvalFeedback: null,
        _count: { versions: 1 },
      });

      const result = await service.applyApprovalAction(pending, 'approve');

      expect(result.status).toBe(PostPackageStatus.approved);
      expect(workspacesService.assertMember).not.toHaveBeenCalled();
    });

    it('returns post to draft with feedback', async () => {
      const pending = buildPost({
        status: PostPackageStatus.ready_for_approval,
        submittedForApprovalAt: new Date('2026-06-27T10:00:00.000Z'),
      });
      prisma.postPackage.update.mockResolvedValue({
        ...pending,
        status: PostPackageStatus.draft,
        approvalFeedback: 'Revise tone',
        submittedForApprovalAt: null,
        _count: { versions: 1 },
      });

      const result = await service.applyApprovalAction(
        pending,
        'request-changes',
        'Revise tone',
      );

      expect(result.status).toBe(PostPackageStatus.draft);
      expect(result.approvalFeedback).toBe('Revise tone');
    });
  });

  describe('list', () => {
    it('excludes soft-deleted posts', async () => {
      prisma.postPackage.findMany.mockResolvedValue([]);

      await service.list(workspaceId, userId, {});

      expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('getPipeline', () => {
    it('returns a column per pipeline stage', async () => {
      prisma.postPackage.findMany.mockResolvedValue([]);
      prisma.postPackage.count.mockResolvedValue(0);

      const result = await service.getPipeline(workspaceId, userId, {});

      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.columns[0]).toMatchObject({
        status: PostPackageStatus.draft,
        label: 'Draft',
        count: 0,
        posts: [],
      });
    });
  });

  describe('getOne', () => {
    it('throws when post is not in workspace', async () => {
      prisma.postPackage.findFirst.mockResolvedValue(null);

      await expect(
        service.getOne(workspaceId, postId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
