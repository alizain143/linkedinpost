import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { PipelineResponseDto } from '../../common/swagger/responses/pipeline-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { PipelineQueryDto } from './dto/pipeline-query.dto';
import { PostsService } from './posts.service';

@ApiTags('pipeline')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/pipeline')
@UseGuards(ClerkAuthGuard)
export class PipelineController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get pipeline kanban columns grouped by post status',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(PipelineResponseDto)
  getPipeline(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() query: PipelineQueryDto,
  ) {
    return this.postsService.getPipeline(workspaceId, user.id, query);
  }
}
