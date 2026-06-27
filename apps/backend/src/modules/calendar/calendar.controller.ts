import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { CalendarResponseDto } from '../../common/swagger/responses/calendar-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@ApiTags('calendar')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/calendar')
@UseGuards(ClerkAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get calendar data (month, week, or list view)' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(CalendarResponseDto)
  getCalendar(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() query: CalendarQueryDto,
  ) {
    return this.calendarService.getCalendar(workspaceId, user.id, query);
  }
}
