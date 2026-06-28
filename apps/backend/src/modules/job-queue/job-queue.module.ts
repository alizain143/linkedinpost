import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import redisConfig from '../../config/redis.config';
import { GENERATION_JOBS_QUEUE, REDIS_ENABLED } from './job-queue.constants';
import { GenerationJobEnqueueService } from './generation-job-enqueue.service';
import { GenerationJobProcessor } from './generation-job.processor';
import { JobHandlerRegistry } from './job-handler.registry';

const sharedProviders = [JobHandlerRegistry, GenerationJobEnqueueService];

@Global()
@Module({})
export class JobQueueModule {
  static forRoot() {
    const redisEnabled = Boolean(process.env.REDIS_URL);

    if (!redisEnabled) {
      return {
        module: JobQueueModule,
        global: true,
        imports: [PrismaModule, ConfigModule.forFeature(redisConfig)],
        providers: [
          ...sharedProviders,
          { provide: REDIS_ENABLED, useValue: false },
        ],
        exports: [GenerationJobEnqueueService, JobHandlerRegistry],
      };
    }

    return {
      module: JobQueueModule,
      global: true,
      imports: [
        PrismaModule,
        ConfigModule.forFeature(redisConfig),
        BullModule.forRootAsync({
          imports: [ConfigModule.forFeature(redisConfig)],
          useFactory: (config: ConfigService) => ({
            connection: { url: config.get<string>('redis.url') },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue({
          name: GENERATION_JOBS_QUEUE,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        }),
      ],
      providers: [
        ...sharedProviders,
        GenerationJobProcessor,
        { provide: REDIS_ENABLED, useValue: true },
      ],
      exports: [GenerationJobEnqueueService, JobHandlerRegistry],
    };
  }
}
