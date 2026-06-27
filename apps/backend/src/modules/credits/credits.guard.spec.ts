import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import { buildUser, userId } from '../../test/fixtures';
import { CREDITS_COST_KEY, CreditsCost } from './credits.decorator';
import { CreditsGuard } from './credits.guard';
import { CreditsService } from './credits.service';

describe('CreditsGuard', () => {
  let guard: CreditsGuard;
  const creditsService = {
    assertHasCredits: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsGuard,
        Reflector,
        { provide: CreditsService, useValue: creditsService },
      ],
    }).compile();

    guard = module.get(CreditsGuard);
  });

  function createContext(
    user: ReturnType<typeof buildUser> | undefined,
    handler: object,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
    } as ExecutionContext;
  }

  it('throws UNAUTHORIZED when user is missing', async () => {
    class Handler {}

    await expect(
      guard.canActivate(createContext(undefined, Handler.prototype)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('asserts default cost of 1', async () => {
    class Handler {}
    creditsService.assertHasCredits.mockResolvedValue(undefined);

    const result = await guard.canActivate(
      createContext(buildUser(), Handler.prototype),
    );

    expect(result).toBe(true);
    expect(creditsService.assertHasCredits).toHaveBeenCalledWith(userId, 1);
  });

  it('reads @CreditsCost metadata from handler', async () => {
    class Handler {
      @CreditsCost(3)
      handle() {}
    }
    const handler = Handler.prototype.handle;
    Reflect.defineMetadata(CREDITS_COST_KEY, 3, handler);
    creditsService.assertHasCredits.mockResolvedValue(undefined);

    await guard.canActivate(createContext(buildUser(), handler));

    expect(creditsService.assertHasCredits).toHaveBeenCalledWith(userId, 3);
  });

  it('propagates CREDITS_EXHAUSTED from service', async () => {
    class Handler {}
    creditsService.assertHasCredits.mockRejectedValue(
      new HttpException(
        { code: 'CREDITS_EXHAUSTED' },
        HttpStatus.PAYMENT_REQUIRED,
      ),
    );

    await expect(
      guard.canActivate(createContext(buildUser(), Handler.prototype)),
    ).rejects.toMatchObject({ status: HttpStatus.PAYMENT_REQUIRED });
  });
});
