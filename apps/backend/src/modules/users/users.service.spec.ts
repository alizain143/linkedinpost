import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { buildUser } from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = createMockPrismaService();
  const documentsService = {
    attachProfileDocument: jest.fn(),
  };
  const workspacesService = {
    ensurePersonalWorkspace: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentsService, useValue: documentsService },
        { provide: WorkspacesService, useValue: workspacesService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findByClerkId', () => {
    it('throws when account is soft-deleted', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildUser({ deletedAt: new Date() }));

      await expect(service.findByClerkId('clerk_deleted')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('createFromClerk', () => {
    it('rejects email merge when an active user already owns the email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildUser({ email: 'taken@example.com' }));

      await expect(
        service.createFromClerk({
          clerkId: 'clerk_new',
          email: 'taken@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reactivates a soft-deleted user with matching email', async () => {
      const deleted = buildUser({
        email: 'returning@example.com',
        deletedAt: new Date(),
      });
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(deleted);
      prisma.user.update.mockResolvedValue({
        ...deleted,
        deletedAt: null,
        clerkId: 'clerk_returning',
      });

      const user = await service.createFromClerk({
        clerkId: 'clerk_returning',
        email: 'returning@example.com',
      });

      expect(user.deletedAt).toBeNull();
      expect(workspacesService.ensurePersonalWorkspace).toHaveBeenCalled();
    });
  });

  describe('updateProfile tours', () => {
    it('merges markTourSeen into toursSeen', async () => {
      const user = buildUser({
        toursSeen: { 'product-core-v1': '2026-01-01T00:00:00.000Z' },
      });
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.findUniqueOrThrow.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await service.updateProfile(user.id, {
        markTourSeen: 'pro-unlock-v1',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toursSeen: expect.objectContaining({
              'product-core-v1': '2026-01-01T00:00:00.000Z',
              'pro-unlock-v1': expect.any(String),
            }),
          }),
        }),
      );
    });
  });
});
