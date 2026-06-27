import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DocumentsService } from './documents.service';

@Injectable()
export class DocumentsCleanupJob {
  private readonly logger = new Logger(DocumentsCleanupJob.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Cron('0 3 * * *')
  async purgeStalePendingDocuments() {
    try {
      const removed = await this.documentsService.purgeStalePendingDocuments();
      if (removed > 0) {
        this.logger.log(`Removed ${removed} stale pending document(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to purge stale pending documents',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
