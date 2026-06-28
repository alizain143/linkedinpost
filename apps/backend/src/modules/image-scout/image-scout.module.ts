import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import googleConfig from '../../config/google.config';
import { GoogleImageSearchClient } from './google-image-search.client';
import { ImageReferenceDownloaderService } from './image-reference-downloader.service';
import { ImageScoutService } from './image-scout.service';

@Module({
  imports: [ConfigModule.forFeature(googleConfig)],
  providers: [
    GoogleImageSearchClient,
    ImageScoutService,
    ImageReferenceDownloaderService,
  ],
  exports: [ImageScoutService, ImageReferenceDownloaderService],
})
export class ImageScoutModule {}
