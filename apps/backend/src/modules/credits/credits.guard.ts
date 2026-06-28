import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { CREDITS_COST_KEY } from './credits.decorator';
import { CreditsService } from './credits.service';

@Injectable()
export class CreditsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly creditsService: CreditsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const cost =
      this.reflector.get<number>(CREDITS_COST_KEY, context.getHandler()) ?? 1;

    await this.creditsService.assertHasCredits(user.id, cost);
    return true;
  }
}
