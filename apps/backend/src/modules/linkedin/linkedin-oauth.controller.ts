import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { LinkedInOAuthService } from './linkedin-oauth.service';

@ApiTags('linkedin')
@Controller()
export class LinkedInOAuthController {
  constructor(private readonly linkedInOAuthService: LinkedInOAuthService) {}

  @Get('workspaces/:workspaceId/linkedin/oauth/start')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Start per-workspace LinkedIn OAuth (supports multiple profiles per user)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  async startWorkspaceOAuth(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query('returnPath') returnPath?: string,
  ) {
    const url = await this.linkedInOAuthService.createAuthorizationUrl(
      workspaceId,
      user.id,
      returnPath,
    );
    return { url };
  }

  @Get('linkedin/oauth/callback')
  @ApiOperation({ summary: 'LinkedIn OAuth callback (no auth)' })
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.linkedInOAuthService.handleOAuthCallback(
      code,
      state,
      error,
    );
    res.redirect(redirectUrl);
  }
}
