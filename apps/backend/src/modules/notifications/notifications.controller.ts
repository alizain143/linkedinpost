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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import {
  NotificationListResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from '../../common/swagger/responses/notification-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiDataResponse(NotificationListResponseDto)
  list(@CurrentUser() user: User, @Query() query: NotificationsQueryDto) {
    return this.notificationsService.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count for topbar badge' })
  @ApiDataResponse(UnreadCountResponseDto)
  unreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiDataResponse(NotificationResponseDto)
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post('devices')
  @ApiOperation({ summary: 'Register or refresh an FCM web push token' })
  registerDevice(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(
      user.id,
      dto.token,
      dto.userAgent,
    );
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Revoke an FCM device token' })
  revokeDevice(@CurrentUser() user: User, @Param('token') token: string) {
    return this.notificationsService.revokeDevice(user.id, decodeURIComponent(token));
  }
}
