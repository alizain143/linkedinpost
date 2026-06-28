import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { PostPackageResponseDto } from '../../common/swagger/responses/post-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/posts')
@UseGuards(ClerkAuthGuard)
export class SchedulingPostController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule an approved post for publishing' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto, { status: 201 })
  schedule(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SchedulePostDto,
  ) {
    return this.schedulingService.schedule(workspaceId, id, user.id, dto);
  }

  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Reschedule a scheduled post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  reschedule(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SchedulePostDto,
  ) {
    return this.schedulingService.reschedule(workspaceId, id, user.id, dto);
  }

  @Delete(':id/schedule')
  @ApiOperation({
    summary: 'Cancel a scheduled post and return it to approved',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  cancelSchedule(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.schedulingService.cancelSchedule(workspaceId, id, user.id);
  }
}
