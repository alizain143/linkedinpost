import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  generationQueueConcurrency: parseInt(
    process.env.GENERATION_QUEUE_CONCURRENCY ?? '2',
    10,
  ),
}));
