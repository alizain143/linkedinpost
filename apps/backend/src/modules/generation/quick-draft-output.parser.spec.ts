import { UnprocessableEntityException } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { QuickDraftOutputParser } from './quick-draft-output.parser';

describe('QuickDraftOutputParser', () => {
  const parser = new QuickDraftOutputParser();

  const validVariant = {
    hook: 'Hook',
    body: 'Body',
    cta: 'CTA',
    tags: ['tag'],
    postType: PostType.personal_story,
    tone: 'Bold',
    pillar: 'Lessons',
  };

  it('parses exactly 3 valid variants', () => {
    const result = parser.parse(
      JSON.stringify({
        variants: [validVariant, validVariant, validVariant],
      }),
    );

    expect(result.variants).toHaveLength(3);
    expect(result.variants[0].hook).toBe('Hook');
  });

  it('throws GENERATION_PARSE_ERROR for invalid JSON', () => {
    expect(() => parser.parse('not-json')).toThrow(
      UnprocessableEntityException,
    );

    try {
      parser.parse('not-json');
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toMatchObject(
        { code: 'GENERATION_PARSE_ERROR' },
      );
    }
  });

  it('throws when variant count is not 3', () => {
    expect(() =>
      parser.parse(JSON.stringify({ variants: [validVariant] })),
    ).toThrow(UnprocessableEntityException);
  });

  it('throws when required fields are missing', () => {
    expect(() =>
      parser.parse(
        JSON.stringify({
          variants: [
            { ...validVariant, hook: '' },
            validVariant,
            validVariant,
          ],
        }),
      ),
    ).toThrow(UnprocessableEntityException);
  });
});
