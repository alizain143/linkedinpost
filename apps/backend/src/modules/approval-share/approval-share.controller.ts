import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { ApprovalShareService } from './approval-share.service';
import { ApprovalLinkStatusResponseDto } from './dto/approval-link-status-response.dto';
import { CreateApprovalLinkResponseDto } from './dto/create-approval-link-response.dto';

@ApiTags('approval-share')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/posts/:postId/approval-link')
@UseGuards(ClerkAuthGuard)
export class ApprovalShareController {
  constructor(private readonly approvalShareService: ApprovalShareService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single-use approval share link' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiDataResponse(CreateApprovalLinkResponseDto, { status: 201 })
  createLink(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
  ) {
    return this.approvalShareService.createLink(workspaceId, postId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get active approval link metadata' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiDataResponse(ApprovalLinkStatusResponseDto)
  getLinkStatus(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
  ) {
    return this.approvalShareService.getLinkStatus(
      workspaceId,
      postId,
      user.id,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Revoke the active approval share link' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiDataResponse(Object, { description: '{ revoked: true }' })
  revokeLink(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
  ) {
    return this.approvalShareService.revokeLink(workspaceId, postId, user.id);
  }
}
