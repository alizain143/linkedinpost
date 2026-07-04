import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../../config/app.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { GenerationModule } from '../generation/generation.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ApprovalShareController } from './approval-share.controller';
import { ApprovalShareService } from './approval-share.service';
import { PublicApprovalController } from './public-approval.controller';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    PrismaModule,
    AuthModule,
    MediaModule,
    WorkspacesModule,
    BillingModule,
    NotificationsModule,
    forwardRef(() => GenerationModule),
  ],
  controllers: [ApprovalShareController, PublicApprovalController],
  providers: [ApprovalShareService],
})
export class ApprovalShareModule {}
