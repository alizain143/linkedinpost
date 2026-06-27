import { registerAs } from '@nestjs/config';

export default registerAs('google', () => ({
  apiKey: process.env.GEMINI_API_KEY ?? '',
  cloudProject: process.env.GOOGLE_CLOUD_PROJECT ?? '',
  cloudLocation: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
  imageModel: process.env.GOOGLE_IMAGE_MODEL ?? 'gemini-3.1-flash-image',
}));
