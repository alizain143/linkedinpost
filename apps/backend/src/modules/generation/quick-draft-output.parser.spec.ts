import { UnprocessableEntityException } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { QuickDraftOutputParser } from './quick-draft-output.parser';

describe('QuickDraftOutputParser', () => {
  const parser = new QuickDraftOutputParser();

  const validVariant = {
    format: 'concise',
    hook: 'Hook',
    body: 'Body',
    cta: 'CTA',
    tags: ['tag'],
    postType: PostType.personal_story,
    tone: 'Bold',
    pillar: 'Lessons',
  };

  it('parses exactly 3 valid variants and normalizes format order', () => {
    const result = parser.parse(
      JSON.stringify({
        variants: [
          { ...validVariant, format: 'pattern_interrupt' },
          { ...validVariant, format: 'concise' },
          { ...validVariant, format: 'detailed' },
        ],
      }),
    );

    expect(result.variants).toHaveLength(3);
    expect(result.variants.map((v) => v.format)).toEqual([
      'concise',
      'detailed',
      'pattern_interrupt',
    ]);
    expect(result.variants[0].hook).toBe('Hook');
  });

  it('assigns formats by index when format is missing', () => {
    const { format: _format, ...withoutFormat } = validVariant;
    const result = parser.parse(
      JSON.stringify({
        variants: [withoutFormat, withoutFormat, withoutFormat],
      }),
    );

    expect(result.variants.map((v) => v.format)).toEqual([
      'concise',
      'detailed',
      'pattern_interrupt',
    ]);
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
