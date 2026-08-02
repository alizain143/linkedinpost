import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AuthModule, WorkspacesModule, MediaModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
