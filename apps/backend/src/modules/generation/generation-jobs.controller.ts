import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { GenerationJobResponseDto } from '../../common/swagger/responses/generation-job-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { GenerationJobsQueryService } from './generation-jobs-query.service';

@ApiTags('generation')
@ApiBearerAuth('bearer')
@Controller('jobs')
@UseGuards(ClerkAuthGuard)
export class GenerationJobsController {
  constructor(
    private readonly generationJobsQueryService: GenerationJobsQueryService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a generation job by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto)
  getJob(@CurrentUser() user: User, @Param('id') id: string) {
    return this.generationJobsQueryService.getJobForUser(id, user.id);
  }
}
