import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { ApprovalsResponseDto } from '../../common/swagger/responses/approvals-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { ApprovalsService } from './approvals.service';
import { ApprovalsQueryDto } from './dto/approvals-query.dto';

@ApiTags('approvals')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/approvals')
@UseGuards(ClerkAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get approvals queue by tab' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(ApprovalsResponseDto)
  getApprovals(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() query: ApprovalsQueryDto,
  ) {
    return this.approvalsService.getApprovals(workspaceId, user.id, query);
  }
}
