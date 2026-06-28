import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobHandlerRegistry } from '../job-queue/job-handler.registry';
import { MediaJobHandler } from './media-job.handler';

@Injectable()
export class MediaJobHandlerRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: JobHandlerRegistry,
    private readonly handler: MediaJobHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.handler);
  }
}
