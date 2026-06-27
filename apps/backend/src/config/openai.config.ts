import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  textModel: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4',
}));
