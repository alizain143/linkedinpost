import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import clerkConfig from './config/clerk.config';
import r2Config from './config/r2.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentProfilesModule } from './modules/content-profiles/content-profiles.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PostsModule } from './modules/posts/posts.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [clerkConfig, r2Config],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    WorkspacesModule,
    ContentProfilesModule,
    PostsModule,
    DashboardModule,
    CalendarModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
