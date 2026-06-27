import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private getClerkClient() {
    return createClerkClient({
      secretKey: this.configService.get<string>('clerk.secretKey'),
    });
  }

  private async ensureUserSynced(clerkId: string) {
    try {
      const user = await this.usersService.findByClerkId(clerkId);

      if (!user.profileDocumentId && !user.profileImageUrl) {
        const clerkUser = await this.getClerkClient().users.getUser(clerkId);
        const synced = await this.usersService.syncClerkProfileImageIfMissing(
          user,
          clerkUser.imageUrl,
          clerkUser.hasImage,
        );
        return this.usersService.ensureUserSetup(synced);
      }

      return this.usersService.ensureUserSetup(user);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      const clerkUser = await this.getClerkClient().users.getUser(clerkId);
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new UnauthorizedException({
          error: 'Clerk user has no email address',
          code: 'USER_NOT_SYNCED',
        });
      }

      return this.usersService.createFromClerk({
        clerkId,
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        profileImageUrl: clerkUser.imageUrl ?? undefined,
        hasClerkProfileImage: clerkUser.hasImage,
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!bearerToken) {
      throw new UnauthorizedException({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const secretKey = this.configService.get<string>('clerk.secretKey');

    try {
      const payload = await verifyToken(bearerToken, { secretKey });

      if (!payload?.sub) {
        throw new UnauthorizedException({
          error: 'Invalid token',
          code: 'UNAUTHORIZED',
        });
      }

      request.auth = {
        userId: payload.sub,
        sessionId: typeof payload.sid === 'string' ? payload.sid : undefined,
      };
      request.user = await this.ensureUserSynced(payload.sub);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED',
      });
    }
  }
}
