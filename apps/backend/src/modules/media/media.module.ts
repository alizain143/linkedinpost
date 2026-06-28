import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import mediaConfig from '../../config/media.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MediaService } from './media.service';

@Module({
  imports: [ConfigModule.forFeature(mediaConfig), PrismaModule, StorageModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
