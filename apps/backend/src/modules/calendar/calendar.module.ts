import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
