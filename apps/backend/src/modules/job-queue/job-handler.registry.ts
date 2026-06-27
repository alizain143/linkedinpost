import { Injectable, OnModuleInit } from '@nestjs/common';
import { GenerationJobType } from '@prisma/client';
import { JobHandler } from './job-handler.interface';

@Injectable()
export class JobHandlerRegistry implements OnModuleInit {
  private readonly handlers = new Map<GenerationJobType, JobHandler>();
  private readonly pending: JobHandler[] = [];

  register(handler: JobHandler): void {
    this.handlers.set(handler.type, handler);
  }

  queue(handler: JobHandler): void {
    this.pending.push(handler);
  }

  onModuleInit(): void {
    for (const handler of this.pending) {
      this.register(handler);
    }
  }

  get(type: GenerationJobType): JobHandler | undefined {
    return this.handlers.get(type);
  }
}
