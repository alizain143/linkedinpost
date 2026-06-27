import { Module } from '@nestjs/common';
import { R2BucketService } from './r2-bucket.service';
import { R2StorageService } from './r2-storage.service';

@Module({
  providers: [R2StorageService, R2BucketService],
  exports: [R2StorageService, R2BucketService],
})
export class StorageModule {}
