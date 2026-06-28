import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { NotificationEventService } from './notification-event.service';

@Injectable()
export class WeeklyReminderJob {
  private readonly logger = new Logger(WeeklyReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEvents: NotificationEventService,
  ) {}

  @Cron('0 * * * *')
  async runHourlyCheck() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          ...NOT_DELETED,
          emailWeeklyReminders: true,
        },
        select: {
          id: true,
          timezone: true,
        },
      });

      let sent = 0;

      for (const user of users) {
        if (!this.isMondayMorningInTimezone(user.timezone)) {
          continue;
        }

        const weekKey = this.currentWeekKey(user.timezone);
        const dedupeKey = `weekly_content_reminder:${user.id}:${weekKey}`;

        await this.notificationEvents.emitWeeklyReminder(user.id, dedupeKey);
        sent += 1;

        if (sent >= 80) {
          this.logger.warn(
            'Weekly reminder batch hit daily email safety cap (80)',
          );
          break;
        }
      }

      if (sent > 0) {
        this.logger.log(`Weekly reminders dispatched for ${sent} user(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Weekly reminder job failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private isMondayMorningInTimezone(timezone: string): boolean {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
      }).formatToParts(new Date());

      const weekday = parts.find((part) => part.type === 'weekday')?.value;
      const hour = Number(
        parts.find((part) => part.type === 'hour')?.value ?? '-1',
      );

      return weekday === 'Mon' && hour === 9;
    } catch {
      return false;
    }
  }

  private currentWeekKey(timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }
}
