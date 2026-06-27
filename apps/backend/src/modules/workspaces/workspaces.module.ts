import { Module, forwardRef } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { UsersModule } from '../users/users.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, ClerkAuthGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
