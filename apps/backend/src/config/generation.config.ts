import { registerAs } from '@nestjs/config';

export default registerAs('generation', () => ({
  specificityPassScore: parseInt(
    process.env.QUICK_DRAFT_SPECIFICITY_PASS_SCORE ?? '70',
    10,
  ),
}));
