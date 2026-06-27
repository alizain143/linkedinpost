import { registerAs } from '@nestjs/config';

export default registerAs('media', () => ({
  generationMock:
    process.env.MEDIA_GENERATION_MOCK === 'true' ||
    process.env.MEDIA_GENERATION_MOCK === undefined,
}));
