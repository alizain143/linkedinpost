import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { GenerationJobResponseDto } from '../../common/swagger/responses/generation-job-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CreditsCost } from '../credits/credits.decorator';
import { CreditsGuard } from '../credits/credits.guard';
import { CouncilRequestDto } from '../council/dto/council-request.dto';
import { CouncilJobService } from '../council/council-job.service';
import { CalendarGenerateRequestDto } from '../calendar-generation/dto/calendar-generate-request.dto';
import { CalendarJobService } from '../calendar-generation/calendar-job.service';
import { QuickDraftRequestDto } from './dto/quick-draft-request.dto';
import { TopicSuggestionsRequestDto } from './dto/topic-suggestions-request.dto';
import { QuickDraftJobService } from './quick-draft-job.service';
import { TopicSuggestionsService } from './topic-suggestions.service';

@ApiTags('generation')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/generate')
@UseGuards(ClerkAuthGuard)
export class GenerationController {
  constructor(
    private readonly quickDraftJobService: QuickDraftJobService,
    private readonly councilJobService: CouncilJobService,
    private readonly calendarJobService: CalendarJobService,
    private readonly topicSuggestionsService: TopicSuggestionsService,
  ) {}

  @Post('quick')
  @UseGuards(CreditsGuard)
  @CreditsCost(1)
  @ApiOperation({ summary: 'Generate 3 quick draft LinkedIn post variants' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto, { status: 201 })
  quickDraft(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: QuickDraftRequestDto,
  ) {
    return this.quickDraftJobService.runQuickDraft(workspaceId, user.id, dto);
  }

  @Post('council')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(CreditsGuard)
  @CreditsCost(3)
  @ApiOperation({ summary: 'Start AI council multi-agent generation (async)' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto, { status: 202 })
  council(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CouncilRequestDto,
  ) {
    return this.councilJobService.enqueueCouncil(workspaceId, user.id, dto);
  }

  @Post('calendar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate a bulk content calendar (async, 7 or 30 posts)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto, { status: 202 })
  calendar(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CalendarGenerateRequestDto,
  ) {
    return this.calendarJobService.enqueueCalendar(workspaceId, user.id, dto);
  }

  @Post('suggest-topics')
  @ApiOperation({
    summary: 'Suggest timely LinkedIn post topics based on profile and form context',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  suggestTopics(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TopicSuggestionsRequestDto,
  ) {
    return this.topicSuggestionsService.suggestTopics(
      workspaceId,
      user.id,
      dto,
    );
  }
}
