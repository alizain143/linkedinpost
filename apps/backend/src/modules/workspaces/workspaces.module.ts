import { Module, forwardRef } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PrismaModule, BillingModule, forwardRef(() => UsersModule)],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, ClerkAuthGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
