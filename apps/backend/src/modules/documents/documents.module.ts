import { Module, forwardRef } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentsCleanupJob } from './documents-cleanup.job';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [StorageModule, forwardRef(() => UsersModule)],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsCleanupJob, ClerkAuthGuard],
  exports: [DocumentsService],
})
export class DocumentsModule {}
