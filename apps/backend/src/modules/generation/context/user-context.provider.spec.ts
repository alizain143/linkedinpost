import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { buildUser, userId } from '../../../test/fixtures';
import { createMockPrismaService } from '../../../test/prisma.mock';
import { UserContextProvider } from './user-context.provider';

describe('UserContextProvider', () => {
  let provider: UserContextProvider;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserContextProvider,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    provider = module.get(UserContextProvider);
  });

  it('loads user context from prisma', async () => {
    const user = buildUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const slice = await provider.provide(
      { workspaceId: 'ws', userId },
      { workspaceId: 'ws', userId },
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(slice.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      timezone: user.timezone,
      plan: user.plan,
    });
  });

  it('returns empty slice when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const slice = await provider.provide(
      { workspaceId: 'ws', userId },
      { workspaceId: 'ws', userId },
    );

    expect(slice).toEqual({});
  });
});
