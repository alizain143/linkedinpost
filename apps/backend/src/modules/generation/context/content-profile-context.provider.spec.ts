import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  buildContentProfile,
  contentProfileId,
  userId,
  workspaceId,
} from '../../../test/fixtures';
import { createMockPrismaService } from '../../../test/prisma.mock';
import { ContentProfileContextProvider } from './content-profile-context.provider';

describe('ContentProfileContextProvider', () => {
  let provider: ContentProfileContextProvider;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentProfileContextProvider,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    provider = module.get(ContentProfileContextProvider);
  });

  it('loads explicit content profile in workspace', async () => {
    const profile = buildContentProfile();
    prisma.contentProfile.findFirst.mockResolvedValue(profile);

    const slice = await provider.provide(
      { workspaceId, userId, contentProfileId },
      { workspaceId, userId },
    );

    expect(prisma.contentProfile.findFirst).toHaveBeenCalledWith({
      where: { id: contentProfileId, workspaceId, deletedAt: null },
      include: { pillars: true },
    });
    expect(slice.contentProfileId).toBe(contentProfileId);
    expect(slice.contentProfile?.pillars).toEqual(['Founder lessons']);
  });

  it('resolves default profile when id is omitted', async () => {
    const profile = buildContentProfile({ isDefault: true });
    prisma.contentProfile.findFirst.mockResolvedValue(profile);

    const slice = await provider.provide(
      { workspaceId, userId },
      { workspaceId, userId },
    );

    expect(prisma.contentProfile.findFirst).toHaveBeenCalledWith({
      where: { workspaceId, isDefault: true, deletedAt: null },
      include: { pillars: true },
    });
    expect(slice.contentProfileId).toBe(contentProfileId);
  });

  it('falls back to oldest profile when no default exists', async () => {
    const profile = buildContentProfile({ isDefault: false });
    prisma.contentProfile.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);

    const slice = await provider.provide(
      { workspaceId, userId },
      { workspaceId, userId },
    );

    expect(prisma.contentProfile.findFirst).toHaveBeenNthCalledWith(2, {
      where: { workspaceId, deletedAt: null },
      include: { pillars: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(slice.contentProfileId).toBe(contentProfileId);
  });

  it('throws GENERATION_CONTEXT_ERROR when no profile exists', async () => {
    prisma.contentProfile.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      provider.provide({ workspaceId, userId }, { workspaceId, userId }),
    ).rejects.toMatchObject({
      response: { code: 'GENERATION_CONTEXT_ERROR' },
    });
  });

  it('throws when explicit profile is not in workspace', async () => {
    prisma.contentProfile.findFirst.mockResolvedValue(null);

    await expect(
      provider.provide(
        { workspaceId, userId, contentProfileId },
        { workspaceId, userId },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
