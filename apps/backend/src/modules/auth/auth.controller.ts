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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import {
  LogoutResponseDto,
  WebhookReceivedResponseDto,
} from '../../common/swagger/responses/auth-response.dto';
import { UserResponseDto } from '../../common/swagger/responses/user-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current user profile and settings' })
  @ApiDataResponse(UserResponseDto, {
    description: 'Current authenticated user',
  })
  getMe(@CurrentUser() user: User) {
    return this.usersService.toUserResponse(user);
  }

  @Patch('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Update account settings, timezone, and notification preferences',
  })
  @ApiDataResponse(UserResponseDto, { description: 'Updated user profile' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return this.usersService.toUserResponse(updated);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Revoke the current Clerk session' })
  @ApiDataResponse(LogoutResponseDto)
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
  @ApiOperation({ summary: 'Clerk webhook receiver (Svix-signed)' })
  @ApiHeader({ name: 'svix-id', required: true })
  @ApiHeader({ name: 'svix-timestamp', required: true })
  @ApiHeader({ name: 'svix-signature', required: true })
  @ApiDataResponse(WebhookReceivedResponseDto)
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

    await this.authService.handleClerkWebhook(event);

    return { received: true };
  }
}
