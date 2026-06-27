import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
import { CouncilJobService } from './council-job.service';

@ApiTags('council')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/posts')
@UseGuards(ClerkAuthGuard)
export class CouncilController {
  constructor(private readonly councilJobService: CouncilJobService) {}

  @Get(':postId/council')
  @ApiOperation({ summary: 'Get AI council timeline history for a post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiDataResponse(Object)
  getCouncilHistory(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
  ) {
    return this.councilJobService.getCouncilHistory(
      workspaceId,
      postId,
      user.id,
    );
  }
}
