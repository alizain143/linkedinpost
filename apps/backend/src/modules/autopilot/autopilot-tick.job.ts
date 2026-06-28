import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AutopilotTickService } from './autopilot-tick.service';

@Injectable()
export class AutopilotTickJob {
  private readonly logger = new Logger(AutopilotTickJob.name);

  constructor(private readonly tickService: AutopilotTickService) {}

  @Cron('0 * * * *')
  async runHourlyTick() {
    try {
      const dispatched = await this.tickService.processDueConfigs();
      if (dispatched > 0) {
        this.logger.log(`Autopilot tick dispatched ${dispatched} job(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Autopilot hourly tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
