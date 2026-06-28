import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { Webhook } from 'svix';
import { UsersService } from '../users/users.service';

export interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    has_image?: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private getClerkClient() {
    return createClerkClient({
      secretKey: this.configService.get<string>('clerk.secretKey'),
    });
  }

  async logout(sessionId: string): Promise<{ success: true }> {
    try {
      await this.getClerkClient().sessions.revokeSession(sessionId);
      return { success: true };
    } catch {
      throw new InternalServerErrorException({
        error: 'Failed to revoke session',
        code: 'LOGOUT_FAILED',
      });
    }
  }

  verifyWebhook(
    payload: Buffer | string,
    headers: Record<string, string | undefined>,
  ): ClerkWebhookEvent {
    const secret = this.configService.get<string>('clerk.webhookSecret');

    if (!secret) {
      throw new BadRequestException({
        error: 'Webhook secret not configured',
        code: 'WEBHOOK_NOT_CONFIGURED',
      });
    }

    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException({
        error: 'Missing Svix headers',
        code: 'WEBHOOK_INVALID',
      });
    }

    try {
      const wh = new Webhook(secret);
      return wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw new BadRequestException({
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_INVALID',
      });
    }
  }

  async handleClerkWebhook(event: ClerkWebhookEvent): Promise<void> {
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const email = event.data.email_addresses?.[0]?.email_address;

      if (!email) {
        if (event.type === 'user.created') {
          throw new BadRequestException({
            error: 'User email missing from webhook',
            code: 'WEBHOOK_INVALID',
          });
        }
        return;
      }

      await this.usersService.createFromClerk({
        clerkId: event.data.id,
        email,
        firstName: event.data.first_name ?? undefined,
        lastName: event.data.last_name ?? undefined,
        profileImageUrl: event.data.image_url ?? undefined,
        hasClerkProfileImage: event.data.has_image ?? undefined,
      });
      return;
    }

    if (event.type === 'user.deleted') {
      await this.usersService.softDelete(event.data.id);
    }
  }
}
