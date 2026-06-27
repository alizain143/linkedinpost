import { registerAs } from '@nestjs/config';

export default registerAs('council', () => ({
  passScore: parseInt(process.env.COUNCIL_PASS_SCORE ?? '75', 10),
  maxTextRevisions: parseInt(process.env.COUNCIL_MAX_TEXT_REVISIONS ?? '1', 10),
  maxMediaRegens: parseInt(process.env.COUNCIL_MAX_MEDIA_REGENS ?? '1', 10),
}));
