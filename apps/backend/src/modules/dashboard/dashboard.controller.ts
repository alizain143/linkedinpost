import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { DashboardStatsResponseDto } from '../../common/swagger/responses/dashboard-stats-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/dashboard')
@UseGuards(ClerkAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get workspace dashboard statistics' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(DashboardStatsResponseDto)
  getStats(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.dashboardService.getStats(workspaceId, user.id);
  }
}
