import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobHandlerRegistry } from '../job-queue/job-handler.registry';
import { CouncilJobHandler } from './council-job.handler';

@Injectable()
export class CouncilJobHandlerRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: JobHandlerRegistry,
    private readonly handler: CouncilJobHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.handler);
  }
}
