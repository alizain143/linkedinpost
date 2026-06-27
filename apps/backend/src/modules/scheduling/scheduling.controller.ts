import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { ListScheduledQueryDto } from './dto/list-scheduled-query.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId')
@UseGuards(ClerkAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('scheduled')
  @ApiOperation({ summary: 'List upcoming scheduled posts' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto, { isArray: true })
  listUpcoming(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() query: ListScheduledQueryDto,
  ) {
    return this.schedulingService.listUpcoming(workspaceId, user.id, query);
  }
}
