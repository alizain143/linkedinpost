import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobHandlerRegistry } from '../job-queue/job-handler.registry';
import { CalendarJobHandler } from './calendar-job.handler';

@Injectable()
export class CalendarJobHandlerRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: JobHandlerRegistry,
    private readonly handler: CalendarJobHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.handler);
  }
}
