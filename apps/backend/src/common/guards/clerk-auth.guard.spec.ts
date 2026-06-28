import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { buildUser } from '../../test/fixtures';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { UsersService } from '../../modules/users/users.service';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({
    users: { getUser: jest.fn() },
  })),
  verifyToken: jest.fn(),
}));

import { verifyToken } from '@clerk/backend';

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  const usersService = {
    findByClerkId: jest.fn(),
    ensureUserSetup: jest.fn(),
    syncClerkProfileImageIfMissing: jest.fn(),
    createFromClerk: jest.fn(),
  };
  const configService = {
    get: jest.fn().mockReturnValue('sk_test'),
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: 'Bearer token' },
      }),
    }),
  } as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'clerk_1', sid: 'sess_1' });
    usersService.ensureUserSetup.mockImplementation((user) => user);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkAuthGuard,
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    guard = module.get(ClerkAuthGuard);
  });

  it('does not create users when findByClerkId reports deleted account', async () => {
    usersService.findByClerkId.mockRejectedValue(
      new UnauthorizedException({
        error: 'Account has been deleted',
        code: 'ACCOUNT_DELETED',
      }),
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.createFromClerk).not.toHaveBeenCalled();
  });

  it('syncs existing users without calling createFromClerk', async () => {
    const user = buildUser({ profileImageUrl: 'https://example.com/avatar.png' });
    usersService.findByClerkId.mockResolvedValue(user);

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(usersService.createFromClerk).not.toHaveBeenCalled();
    expect(usersService.ensureUserSetup).toHaveBeenCalledWith(user);
  });
});
