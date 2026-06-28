import { Injectable, Logger } from '@nestjs/common';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_TIMEZONE, getTodayDateKey } from '../calendar/calendar-date.util';
import { AutopilotDispatchService } from './autopilot-dispatch.service';
import { isDueNow } from './autopilot-schedule.util';

@Injectable()
export class AutopilotTickService {
  private readonly logger = new Logger(AutopilotTickService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: AutopilotDispatchService,
  ) {}

  async processDueConfigs(now = new Date()): Promise<number> {
    const configs = await this.prisma.autopilotConfig.findMany({
      where: {
        enabled: true,
        ...NOT_DELETED,
        workspace: NOT_DELETED,
      },
      include: {
        workspace: {
          include: { owner: true },
        },
      },
    });

    let dispatched = 0;

    for (const config of configs) {
      const timezone =
        config.workspace.owner.timezone || DEFAULT_TIMEZONE;

      if (!isDueNow(config, timezone, now)) {
        continue;
      }

      const todayKey = getTodayDateKey(timezone, now);

      const claimed = await this.prisma.autopilotConfig.updateMany({
        where: {
          id: config.id,
          OR: [{ lastRunDateKey: null }, { lastRunDateKey: { not: todayKey } }],
        },
        data: { lastRunDateKey: todayKey },
      });

      if (claimed.count === 0) {
        continue;
      }

      const result = await this.dispatchService.dispatch(
        config,
        config.workspace.ownerId,
        timezone,
        now,
      );

      if (!result.success) {
        await this.prisma.autopilotConfig.update({
          where: { id: config.id },
          data: { lastRunDateKey: null },
        });
        continue;
      }

      if (result.nextPillarIndex !== undefined) {
        await this.prisma.autopilotConfig.update({
          where: { id: config.id },
          data: { lastPillarIndex: result.nextPillarIndex },
        });
      }

      dispatched++;
      this.logger.log(
        `Dispatched autopilot council job for workspace ${config.workspaceId}`,
      );
    }

    return dispatched;
  }
}
