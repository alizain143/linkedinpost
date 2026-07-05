import { Controller, Delete, Get, Param, Post, UseGuards, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { PostPackageResponseDto } from '../../common/swagger/responses/post-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import {
  LinkedInConnectionService,
  LinkedInProfileService,
  LinkedInPublishService,
} from './linkedin.services';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';
import { BindWorkspaceLinkedInDto } from './dto/bind-workspace-linkedin.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotFoundException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';

@ApiTags('linkedin')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(ClerkAuthGuard)
export class LinkedInController {
  constructor(
    private readonly linkedInConnectionService: LinkedInConnectionService,
    private readonly linkedInProfileService: LinkedInProfileService,
  ) {}

  @Get('linkedin/connection')
  @ApiOperation({ summary: 'Get LinkedIn connection and publish scope status' })
  getConnection(@CurrentUser() user: User) {
    return this.linkedInConnectionService.getConnection(user.id);
  }

  @Get('linkedin/profile')
  @ApiOperation({ summary: 'Get cached LinkedIn profile for the current user' })
  getProfile(@CurrentUser() user: User) {
    return this.linkedInProfileService.getProfile(user.id);
  }

  @Post('linkedin/profile/sync')
  @ApiOperation({
    summary:
      'Sync LinkedIn profile from Clerk token (name, title, company, education)',
  })
  syncProfile(@CurrentUser() user: User) {
    return this.linkedInProfileService.syncProfile(user.id);
  }
}

@ApiTags('linkedin')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/linkedin')
@UseGuards(ClerkAuthGuard)
export class WorkspaceLinkedInController {
  constructor(
    private readonly linkedInConnectionService: LinkedInConnectionService,
    private readonly linkedInProfileService: LinkedInProfileService,
  ) {}

  @Get('connection')
  @ApiOperation({
    summary: 'Get LinkedIn connection status for the active workspace',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  getWorkspaceConnection(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.linkedInConnectionService.getWorkspaceConnection(
      workspaceId,
      user.id,
    );
  }

  @Post('connection')
  @ApiOperation({
    summary: 'Bind the current Clerk LinkedIn account to this workspace',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  bindWorkspaceConnection(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: BindWorkspaceLinkedInDto,
  ) {
    return this.linkedInConnectionService.bindWorkspaceConnection(
      workspaceId,
      user.id,
      dto.clerkExternalAccountId,
    );
  }

  @Delete('connection')
  @ApiOperation({
    summary: 'Remove LinkedIn connection from this workspace',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  disconnectWorkspaceConnection(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.linkedInConnectionService.disconnectWorkspaceConnection(
      workspaceId,
      user.id,
    );
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get cached LinkedIn profile for this workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  getWorkspaceProfile(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.linkedInProfileService.getWorkspaceProfile(workspaceId, user.id);
  }

  @Post('profile/sync')
  @ApiOperation({
    summary: 'Sync LinkedIn profile for this workspace from Clerk token',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  syncWorkspaceProfile(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.linkedInProfileService.syncWorkspaceProfile(
      workspaceId,
      user.id,
    );
  }
}

@ApiTags('linkedin')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/posts')
@UseGuards(ClerkAuthGuard)
export class LinkedInPostController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly linkedInPublishService: LinkedInPublishService,
    private readonly publishJobEnqueueService: PublishJobEnqueueService,
  ) {}

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish an approved, scheduled, or failed post to LinkedIn',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  async publish(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspacesService.assertMember(user.id, workspaceId);

    const post = await this.prisma.postPackage.findFirst({
      where: { id, workspaceId },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    if (post.status === PostPackageStatus.scheduled) {
      await this.publishJobEnqueueService.cancelPublish(post.id);
    }

    return this.linkedInPublishService.publishPostForWorkspace(
      id,
      workspaceId,
      workspace.ownerId,
    );
  }
}
