import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import {
  RejectPostDto,
  RequestChangesDto,
} from '../approvals/dto/request-changes.dto';
import { ApprovalShareService } from './approval-share.service';
import {
  PublicApprovalActionResponseDto,
  PublicApprovalPreviewDto,
} from './dto/public-approval-preview.dto';

@ApiTags('public-approval')
@Controller('public/approval')
export class PublicApprovalController {
  constructor(private readonly approvalShareService: ApprovalShareService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Preview a post awaiting approval (no auth)' })
  @ApiParam({ name: 'token' })
  @ApiDataResponse(PublicApprovalPreviewDto)
  getPreview(@Param('token') token: string) {
    return this.approvalShareService.getPreview(token);
  }

  @Post(':token/approve')
  @ApiOperation({ summary: 'Approve a post via share link (no auth)' })
  @ApiParam({ name: 'token' })
  @ApiDataResponse(PublicApprovalActionResponseDto)
  approve(@Param('token') token: string) {
    return this.approvalShareService.approve(token);
  }

  @Post(':token/request-changes')
  @ApiOperation({ summary: 'Request changes via share link (no auth)' })
  @ApiParam({ name: 'token' })
  @ApiDataResponse(PublicApprovalActionResponseDto)
  requestChanges(
    @Param('token') token: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.approvalShareService.requestChanges(token, dto.feedback);
  }

  @Post(':token/reject')
  @ApiOperation({ summary: 'Reject a post via share link (no auth)' })
  @ApiParam({ name: 'token' })
  @ApiDataResponse(PublicApprovalActionResponseDto)
  reject(@Param('token') token: string, @Body() dto: RejectPostDto) {
    return this.approvalShareService.reject(token, dto.feedback);
  }
}
