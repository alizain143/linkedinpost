import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
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
import { AutopilotService } from './autopilot.service';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';

@ApiTags('autopilot')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/autopilot')
@UseGuards(ClerkAuthGuard)
export class AutopilotController {
  constructor(private readonly autopilotService: AutopilotService) {}

  @Get()
  @ApiOperation({ summary: 'Get autopilot configuration' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  getConfig(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.autopilotService.getConfig(workspaceId, user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Create or update autopilot configuration' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  upsertConfig(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpsertAutopilotConfigDto,
  ) {
    return this.autopilotService.upsertConfig(workspaceId, user.id, dto);
  }

  @Get('planned')
  @ApiOperation({ summary: 'List upcoming autopilot posts' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto, { isArray: true })
  getPlannedPosts(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.autopilotService.getPlannedPosts(workspaceId, user.id);
  }
}
