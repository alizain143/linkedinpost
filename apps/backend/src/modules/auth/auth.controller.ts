import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@CurrentUser() user: User) {
    return this.usersService.toUserResponse(user);
  }

  @Patch('me')
  @UseGuards(ClerkAuthGuard)
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return this.usersService.toUserResponse(updated);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(ClerkAuthGuard)
  logout(@Req() req: Request) {
    const sessionId = req.auth?.sessionId;

    if (!sessionId) {
      throw new BadRequestException({
        error: 'Session ID missing from token',
        code: 'SESSION_REQUIRED',
      });
    }

    return this.authService.logout(sessionId);
  }

  @Post('webhooks/clerk')
  @HttpCode(200)
  async clerkWebhook(
    @Req() req: RawBodyRequest,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException({
        error: 'Missing request body',
        code: 'WEBHOOK_INVALID',
      });
    }

    const event = this.authService.verifyWebhook(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });

    if (event.type === 'user.created') {
      const email = event.data.email_addresses?.[0]?.email_address;

      if (!email) {
        throw new BadRequestException({
          error: 'User email missing from webhook',
          code: 'WEBHOOK_INVALID',
        });
      }

      await this.usersService.createFromClerk({
        clerkId: event.data.id,
        email,
        firstName: event.data.first_name ?? undefined,
        lastName: event.data.last_name ?? undefined,
        profileImageUrl: event.data.image_url ?? undefined,
        hasClerkProfileImage: event.data.has_image ?? undefined,
      });
    }

    if (event.type === 'user.deleted') {
      await this.usersService.softDelete(event.data.id);
    }

    return { received: true };
  }
}
